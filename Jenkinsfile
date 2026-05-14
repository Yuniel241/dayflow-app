pipeline {
    agent any

    stages {
        stage('Preparation') {
            steps {
                withCredentials([file(credentialsId: 'dayflow-server-env', variable: 'ENV_FILE')]) {
                    sh "cp \$ENV_FILE server/.env"
                }
            }
        }

        stage('Build & Deploy') {
            steps {
                echo 'Nettoyage et mise à jour de l\'application dayflow-app...'
                // Force l'arrêt du projet existant nommé dayflow-app
                sh 'docker compose -p dayflow-app down'
                // Reconstruit et relance sous le même nom de projet
                sh 'docker compose -p dayflow-app up -d --build'
            }
        }

        stage('Nettoyage') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }
}
