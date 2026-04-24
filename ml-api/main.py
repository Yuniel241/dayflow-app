# C:\Users\axelm\Programmation\dayflow-app\ml-api\main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os
import numpy as np
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import json
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles Pydantic
class Activity(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(alias="_id")
    name: str
    duration: int
    priority: int
    category: str
    type: str
    color: str
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    days: List[str] = []
    deadline: Optional[str] = None
    isActive: bool = True
    emoji: str = "📌"

class UserProfile(BaseModel):
    wakeUpTime: str = "05:00"
    sleepTime: str = "22:00"
    courseEndTime: str = "18:00"
    arrivalTime: str = "20:30"
    energyPeaks: List[str] = ["08:00", "14:00"]
    preferredWorkDays: List[str] = ["lun", "mar", "mer", "jeu", "ven"]
    avgProductivityScore: float = 0.7

class PlanningRequest(BaseModel):
    userId: str
    user: UserProfile
    activities: List[Activity]
    weekStart: str

class Feedback(BaseModel):
    userId: str
    activityId: str
    date: str
    completed: bool
    satisfactionScore: int  # 1-5
    actualDuration: Optional[int] = None

# Database connection (lazy + fallback)
class Database:
    def __init__(self):
        try:
            from pymongo import MongoClient  # lazy import (can be slow on Windows)
        except Exception as e:
            raise RuntimeError(f"pymongo import failed: {e}") from e

        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/dayflow")
        db_name = os.getenv("ML_DB_NAME", "dayflow")
        patterns_collection = os.getenv("ML_COLLECTION_NAME", "ml_user_patterns")
        feedback_collection = os.getenv("ML_FEEDBACK_COLLECTION_NAME", "ml_feedback_history")
        metadata_collection = os.getenv("ML_MODEL_METADATA_COLLECTION_NAME", "ml_model_metadata")

        self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        self.db = self.client[db_name]
        self.user_patterns = self.db[patterns_collection]
        self.feedback_history = self.db[feedback_collection]
        self.model_metadata = self.db[metadata_collection]
        self.create_indexes()

    def create_indexes(self):
        self.user_patterns.create_index("user_id", unique=True)
        self.feedback_history.create_index([("user_id", 1), ("created_at", -1)])
        self.model_metadata.create_index("user_id", unique=True)
    
    def get_user_patterns(self, user_id):
        doc = self.user_patterns.find_one({"user_id": str(user_id)})
        if not doc:
            return None

        return {
            "productivity_patterns": doc.get("productivity_patterns", {}),
            "preferred_time_slots": doc.get("preferred_time_slots", {}),
            "activity_success_rates": doc.get("activity_success_rates", {}),
            "energy_levels": doc.get("energy_levels", {}),
        }
    
    def save_user_patterns(self, user_id, patterns):
        self.user_patterns.update_one(
            {"user_id": str(user_id)},
            {
                "$set": {
                    "productivity_patterns": patterns.get("productivity_patterns", {}),
                    "preferred_time_slots": patterns.get("preferred_time_slots", {}),
                    "activity_success_rates": patterns.get("activity_success_rates", {}),
                    "energy_levels": patterns.get("energy_levels", {}),
                    "updated_at": datetime.utcnow(),
                }
            },
            upsert=True,
        )
    
    def save_feedback(self, feedback):
        self.feedback_history.insert_one(
            {
                "user_id": str(feedback.userId),
                "activity_id": str(feedback.activityId),
                "date": feedback.date,
                "completed": bool(feedback.completed),
                "satisfaction_score": int(feedback.satisfactionScore),
                "actual_duration": feedback.actualDuration,
                "predicted_duration": None,
                "created_at": datetime.utcnow(),
            }
        )

class InMemoryDatabase:
    def __init__(self):
        self._patterns = {}
        self._feedback = []

    def get_user_patterns(self, user_id):
        return self._patterns.get(str(user_id))

    def save_user_patterns(self, user_id, patterns):
        self._patterns[str(user_id)] = patterns

    def save_feedback(self, feedback):
        self._feedback.append(
            {
                "user_id": str(feedback.userId),
                "activity_id": str(feedback.activityId),
                "date": feedback.date,
                "completed": bool(feedback.completed),
                "satisfaction_score": int(feedback.satisfactionScore),
                "actual_duration": feedback.actualDuration,
                "created_at": datetime.utcnow(),
            }
        )

# Global db handle, initialized on startup
db = None

@app.on_event("startup")
def _startup_init_db():
    global db
    try:
        db = Database()
        # quick connectivity probe
        db.client.admin.command("ping")
        logger.info("ML API connected to MongoDB")
    except Exception as e:
        logger.warning(f"ML API MongoDB unavailable, using in-memory storage: {e}")
        db = InMemoryDatabase()

# db is initialized in FastAPI startup event

# ML Models Container
class UserModel:
    def __init__(self, user_id):
        self.user_id = user_id
        self.productivity_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.time_preference_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def extract_features(self, activity, hour, day_of_week, user_patterns):
        """Extract features for ML prediction"""
        features = []
        
        # Activity features
        features.append(activity.duration / 60)  # normalized duration
        features.append(activity.priority)  # 1-3
        features.append(hour / 24)  # hour of day normalized
        
        # Category one-hot
        categories = ['études', 'projet', 'routine', 'loisirs', 'sport']
        for cat in categories:
            features.append(1 if activity.category == cat else 0)
        
        # Day features
        features.append(day_of_week / 6)  # 0-6 normalized
        features.append(1 if day_of_week >= 5 else 0)  # weekend
        
        # User historical patterns
        if user_patterns:
            hour_key = f"{int(hour)}:00"
            energy = user_patterns.get("energy_levels", {}).get(hour_key, 0.5)
            features.append(energy)
            
            category_success = user_patterns.get("activity_success_rates", {}).get(activity.category, 0.5)
            features.append(category_success)
        else:
            features.extend([0.5, 0.5])
        
        return np.array(features).reshape(1, -1)
    
    def train(self, historical_data):
        """Train model on historical feedback"""
        if len(historical_data) < 50:
            logger.info(f"Not enough data to train model for user {self.user_id}")
            return
        
        X = []
        y = []
        
        for data in historical_data:
            features = self.extract_features(
                data['activity'],
                data['hour'],
                data['day_of_week'],
                data.get('patterns', {})
            )
            X.append(features.flatten())
            y.append(data['satisfaction_score'] or (1 if data['completed'] else 0))
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.productivity_model.fit(X_scaled, y)
        self.is_trained = True
        
        logger.info(f"Model trained for user {self.user_id} with {len(X)} samples")
    
    def predict_productivity(self, activity, hour, day_of_week, user_patterns):
        """Predict productivity score for a time slot"""
        features = self.extract_features(activity, hour, day_of_week, user_patterns)
        if self.is_trained:
            features_scaled = self.scaler.transform(features)
            return float(self.productivity_model.predict(features_scaled)[0])
        else:
            # Fallback heuristic
            return self.heuristic_productivity_score(activity, hour, day_of_week)
    
    def heuristic_productivity_score(self, activity, hour, day_of_week):
        """Fallback heuristic when model not trained"""
        # Morning peak for studies
        if activity.category in ['études', 'projet'] and 8 <= hour <= 12:
            return 0.9
        # Afternoon for routine
        if activity.category == 'routine' and 5 <= hour <= 8:
            return 0.85
        # Evening for leisure
        if activity.category in ['loisirs', 'sport'] and 18 <= hour <= 21:
            return 0.8
        # Default
        return 0.6

# Store models in memory
user_models = {}

def get_user_model(user_id):
    if user_id not in user_models:
        user_models[user_id] = UserModel(user_id)
        # Load historical data and train
        patterns = db.get_user_patterns(user_id)
        if patterns:
            # Train model with historical data
            pass
    return user_models[user_id]

# Time utility functions
def time_to_min(time_str):
    if not time_str:
        return 0
    h, m = map(int, time_str.split(':'))
    return h * 60 + m

def min_to_time(minutes):
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"

def get_energy_score(hour, category, user_patterns=None):
    """Enhanced energy scoring with ML predictions"""
    # Base energy curve
    if 5 <= hour < 8:  # Early morning
        base = 7 if category in ['routine', 'sport'] else 6
    elif 8 <= hour < 12:  # Morning peak
        base = 9 if category in ['études', 'projet'] else 7
    elif 12 <= hour < 18:  # Afternoon
        base = 6
    elif 18 <= hour < 21:  # Evening
        base = 7 if category in ['projet', 'loisirs'] else 5
    elif 21 <= hour < 23:  # Late evening
        base = 4 if category == 'loisirs' else 3
    else:
        base = 2
    
    # Adjust with user patterns if available
    if user_patterns and 'energy_levels' in user_patterns:
        hour_key = f"{int(hour)}:00"
        user_energy = user_patterns['energy_levels'].get(hour_key, 0.5)
        base = base * (0.5 + user_energy)
    
    return min(10, max(0, base))

class IntelligentPlanner:
    def __init__(self, user_id, user_profile, activities, week_start, user_model):
        self.user_id = user_id
        self.user_profile = user_profile
        self.activities = activities
        self.week_start = week_start
        self.user_model = user_model
        self.user_patterns = db.get_user_patterns(user_id)
        
        # Day configuration
        self.day_names = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
        self.week_start_date = datetime.strptime(week_start, '%Y-%m-%d')
        
    def get_fixed_blocks(self, day_name):
        """Get fixed time blocks based on user schedule"""
        is_weekend = day_name in ['sam', 'dim']
        wake_min = time_to_min(self.user_profile.wakeUpTime)
        sleep_min = time_to_min(self.user_profile.sleepTime)
        course_end_min = time_to_min(self.user_profile.courseEndTime)
        arrival_min = time_to_min(self.user_profile.arrivalTime)
        
        blocks = [
            {'start': 0, 'end': wake_min, 'label': 'Sommeil', 'type': 'sleep'},
            {'start': wake_min, 'end': wake_min + 30, 'label': 'Routine matinale', 'type': 'routine'},
            {'start': sleep_min, 'end': 24*60, 'label': 'Sommeil', 'type': 'sleep'},
        ]
        
        if not is_weekend:
            depart_min = wake_min + 60
            blocks.append({'start': depart_min, 'end': course_end_min, 'label': 'Cours', 'type': 'course'})
            blocks.append({'start': course_end_min, 'end': arrival_min, 'label': 'Transport', 'type': 'transport'})
        
        return blocks
    
    def compute_free_slots(self, fixed_blocks):
        """Compute free time slots between fixed blocks"""
        sorted_blocks = sorted(fixed_blocks, key=lambda x: x['start'])
        
        # Merge overlapping blocks
        merged = []
        for block in sorted_blocks:
            if not merged or block['start'] > merged[-1]['end']:
                merged.append(block.copy())
            else:
                merged[-1]['end'] = max(merged[-1]['end'], block['end'])
        
        # Find free slots
        free_slots = []
        cursor = 0
        for block in merged:
            if block['start'] > cursor + 20:  # Min 20min slot
                free_slots.append({'start': cursor, 'end': block['start']})
            cursor = max(cursor, block['end'])
        
        if cursor < 24*60 - 20:
            free_slots.append({'start': cursor, 'end': 24*60})
        
        return free_slots
    
    def calculate_optimal_score(self, activity, slot_start, slot_duration, day_idx):
        """Calculate optimal placement score using ML"""
        hour = slot_start / 60
        day_of_week = day_idx
        
        # ML predicted productivity
        ml_score = self.user_model.predict_productivity(activity, hour, day_of_week, self.user_patterns)
        
        # Energy score
        energy = get_energy_score(hour, activity.category, self.user_patterns)
        
        # Priority boost (1=high priority)
        priority_boost = (4 - activity.priority) * 0.15
        
        # Time fit (avoid wasting too much time)
        time_fit = min(1.0, activity.duration / slot_duration)
        
        # Deadline urgency
        deadline_urgency = 0
        if activity.deadline:
            deadline_min = time_to_min(activity.deadline)
            time_until_deadline = max(0, deadline_min - slot_start)
            if time_until_deadline < 24*60:  # Within 24h
                deadline_urgency = 0.3
            elif time_until_deadline < 48*60:  # Within 48h
                deadline_urgency = 0.15
        
        # Day preference (avoid overloading same day)
        day_penalty = 0
        if hasattr(self, 'day_load'):
            day_penalty = min(0.3, self.day_load.get(day_idx, 0) / 100)
        
        # Calculate final score
        score = (
            ml_score * 0.4 +
            (energy / 10) * 0.25 +
            priority_boost * 0.15 +
            time_fit * 0.1 +
            deadline_urgency * 0.1 -
            day_penalty
        )
        
        return score
    
    def generate_planning(self):
        """Main planning generation with ML optimization"""
        # Initialize day contexts
        day_contexts = []
        for idx, day_name in enumerate(self.day_names):
            date = self.week_start_date + timedelta(days=idx)
            
            fixed_blocks = self.get_fixed_blocks(day_name)
            free_slots = self.compute_free_slots(fixed_blocks)
            total_free = sum(slot['end'] - slot['start'] for slot in free_slots)
            
            day_contexts.append({
                'day_name': day_name,
                'date': date.strftime('%Y-%m-%d'),
                'is_weekend': day_name in ['sam', 'dim'],
                'free_slots': free_slots,
                'total_free': total_free,
                'used_min': 0,
                'planned_slots': []
            })
        
        # Add fixed routine to all days
        wake_min = time_to_min(self.user_profile.wakeUpTime)
        for ctx in day_contexts:
            ctx['planned_slots'].append({
                'activityName': 'Routine matinale',
                'category': 'routine',
                'color': '#a3e635',
                'emoji': '🌅',
                'startTime': min_to_time(wake_min),
                'endTime': min_to_time(wake_min + 30),
                'duration': 30,
                'done': False
            })
        
        # Separate activities
        fixed_activities = [a for a in self.activities if a.type == 'fixe' and a.isActive]
        flexible_activities = [a for a in self.activities if a.type != 'fixe' and a.isActive]
        
        # Sort flexible activities by priority and duration
        flexible_activities.sort(key=lambda x: (-x.priority, -x.duration))
        
        # Place fixed activities
        for act in fixed_activities:
            for ctx in day_contexts:
                if act.days and ctx['day_name'] not in act.days:
                    continue
                if act.startTime and act.endTime:
                    ctx['planned_slots'].append({
                        'activityId': act.id,
                        'activityName': act.name,
                        'category': act.category,
                        'color': act.color,
                        'emoji': act.emoji,
                        'startTime': act.startTime,
                        'endTime': act.endTime,
                        'duration': act.duration,
                        'done': False
                    })
        
        # Track day load for distribution
        self.day_load = defaultdict(float)
        
        # Place flexible activities with ML optimization
        for act in flexible_activities:
            best_score = -1
            best_placement = None
            
            for day_idx, ctx in enumerate(day_contexts):
                # Check day constraints
                if act.days and ctx['day_name'] not in act.days:
                    continue
                
                # Check deadline
                if act.deadline:
                    deadline_date = datetime.strptime(act.deadline, '%Y-%m-%d')
                    if datetime.strptime(ctx['date'], '%Y-%m-%d') > deadline_date:
                        continue
                
                for slot_idx, slot in enumerate(ctx['free_slots']):
                    slot_duration = slot['end'] - slot['start']
                    if slot_duration < act.duration:
                        continue
                    
                    # Try different start times within the slot
                    for start_offset in range(0, slot_duration - act.duration + 1, 15):
                        start_min = slot['start'] + start_offset
                        score = self.calculate_optimal_score(act, start_min, slot_duration, day_idx)
                        
                        if score > best_score:
                            best_score = score
                            best_placement = {
                                'day_idx': day_idx,
                                'slot_idx': slot_idx,
                                'start_min': start_min
                            }
            
            # Place activity at best location
            if best_placement:
                ctx = day_contexts[best_placement['day_idx']]
                slot = ctx['free_slots'][best_placement['slot_idx']]
                start_min = best_placement['start_min']
                end_min = start_min + act.duration
                
                ctx['planned_slots'].append({
                    'activityId': act.id,
                    'activityName': act.name,
                    'category': act.category,
                    'color': act.color,
                    'emoji': act.emoji,
                    'startTime': min_to_time(start_min),
                    'endTime': min_to_time(end_min),
                    'duration': act.duration,
                    'done': False,
                    'ml_score': best_score
                })
                
                ctx['used_min'] += act.duration
                self.day_load[best_placement['day_idx']] += act.duration
                
                # Update free slot
                remaining_before = start_min - slot['start']
                remaining_after = slot['end'] - end_min
                
                new_slots = []
                if remaining_before >= 20:
                    new_slots.append({'start': slot['start'], 'end': start_min})
                if remaining_after >= 20:
                    new_slots.append({'start': end_min, 'end': slot['end']})
                
                ctx['free_slots'].pop(best_placement['slot_idx'])
                ctx['free_slots'][best_placement['slot_idx']:best_placement['slot_idx']] = new_slots
        
        # Sort slots by time for each day
        for ctx in day_contexts:
            ctx['planned_slots'].sort(key=lambda x: time_to_min(x['startTime']))
        
        # Calculate statistics
        stats = self.calculate_statistics(day_contexts)
        
        return {
            'week': [
                {
                    'date': ctx['date'],
                    'slots': ctx['planned_slots']
                }
                for ctx in day_contexts
            ],
            'statistics': stats,
            'ml_confidence': self.user_model.is_trained
        }
    
    def calculate_statistics(self, day_contexts):
        """Calculate planning statistics"""
        total_planned = sum(len(ctx['planned_slots']) for ctx in day_contexts)
        total_flexible = sum(ctx['used_min'] for ctx in day_contexts)
        total_available = sum(ctx['total_free'] for ctx in day_contexts)
        
        return {
            'total_activities': total_planned,
            'total_flexible_minutes': total_flexible,
            'utilization_rate': total_flexible / total_available if total_available > 0 else 0,
            'days_utilized': sum(1 for ctx in day_contexts if ctx['used_min'] > 0),
            'average_ml_score': np.mean([
                slot.get('ml_score', 0)
                for ctx in day_contexts
                for slot in ctx['planned_slots']
                if 'ml_score' in slot
            ]) if total_planned > 0 else 0
        }

@app.post("/api/generate-planning")
async def generate_planning(request: PlanningRequest):
    """Generate intelligent planning using ML"""
    try:
        logger.info(f"Generating planning for user {request.userId}")
        
        # Get or create user model
        user_model = get_user_model(request.userId)
        
        # Create planner
        planner = IntelligentPlanner(
            user_id=request.userId,
            user_profile=request.user,
            activities=request.activities,
            week_start=request.weekStart,
            user_model=user_model
        )
        
        # Generate planning
        result = planner.generate_planning()
        
        return {
            "success": True,
            "planning": result['week'],
            "statistics": result['statistics'],
            "ml_active": result['ml_confidence'],
            "message": "Planning généré avec l'algorithme intelligent ML"
        }
        
    except Exception as e:
        logger.error(f"Error generating planning: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(feedback: Feedback):
    """Submit feedback for learning"""
    try:
        # Save feedback
        db.save_feedback(feedback)
        
        # Update user patterns
        patterns = db.get_user_patterns(feedback.userId) or {
            "productivity_patterns": {},
            "preferred_time_slots": {},
            "activity_success_rates": {},
            "energy_levels": {}
        }
        
        # Update success rates
        category = feedback.activityId  # You'd need to map this
        current_rate = patterns["activity_success_rates"].get(category, 0.5)
        new_rate = current_rate * 0.9 + (0.1 if feedback.completed else 0)
        patterns["activity_success_rates"][category] = new_rate
        
        # Update energy patterns based on completion time
        if feedback.completed and feedback.satisfactionScore >= 4:
            hour = datetime.now().hour
            hour_key = f"{hour}:00"
            current_energy = patterns["energy_levels"].get(hour_key, 0.5)
            patterns["energy_levels"][hour_key] = min(1.0, current_energy + 0.05)
        
        db.save_user_patterns(feedback.userId, patterns)
        
        # Retrain model if enough new data
        # (You'd fetch historical data and retrain here)
        
        return {"success": True, "message": "Feedback enregistré, le modèle va s'améliorer"}
        
    except Exception as e:
        logger.error(f"Error saving feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model-status/{user_id}")
async def get_model_status(user_id: str):
    """Get ML model training status"""
    model = get_user_model(user_id)
    patterns = db.get_user_patterns(user_id)
    
    return {
        "user_id": user_id,
        "is_trained": model.is_trained,
        "has_patterns": patterns is not None,
        "data_points": 0,  # You'd count from feedback_history
        "recommendation": "Continue d'utiliser l'app pour améliorer les prédictions"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)