pipeline {
    agent any

    stages {
        stage('Nettoyage') {
            steps {
                echo 'Nettoyage des images orphelines pour gagner de la place...'
                sh 'docker image prune -f'
            }
        }

        stage('Build & Deploy') {
            steps {
                echo 'Lancement du déploiement DayFlow via Docker Compose...'
                // Le flag --build force la reconstruction des images si le code a changé
                sh 'docker compose up -d --build'
            }
        }

        stage('Vérification') {
            steps {
                echo 'Vérification du statut des conteneurs...'
                sh 'docker ps | grep dayflow'
            }
        }
    }
    
    post {
        success {
            echo 'Déploiement réussi ! DayFlow est à jour.'
        }
        failure {
            echo 'Erreur lors du déploiement. Vérifie les logs Docker.'
        }
    }
}