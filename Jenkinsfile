pipeline {
    agent any

    stages {
        stage('Preparation') {
            steps {
                // On récupère le fichier secret et on le place temporairement dans le workspace
                withCredentials([file(credentialsId: 'dayflow-server-env', variable: 'ENV_FILE')]) {
                    sh "cp \$ENV_FILE server/.env"
                }
            }
        }

        stage('Build & Deploy') {
            steps {
                echo 'Lancement du déploiement...'
                // Plus besoin de chemins compliqués, docker compose suffit
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