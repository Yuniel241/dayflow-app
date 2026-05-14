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
                echo 'Nettoyage de l\'ancien déploiement et relancement...'
                // Arrête les conteneurs existants du projet et supprime les orphelins
                sh 'docker compose down --remove-orphans'
                // Lance le nouveau build
                sh 'docker compose up -d --build'
            }
        }

        stage('Nettoyage') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }
}
