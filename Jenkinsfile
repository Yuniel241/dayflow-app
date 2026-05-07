pipeline {
    agent any

    stages {
        stage('Nettoyage') {
            steps {
                // On utilise le chemin que tu as trouvé : /usr/bin/docker
                sh '/usr/bin/docker image prune -f'
            }
        }

        stage('Build & Deploy') {
            steps {
                echo 'Lancement du déploiement via Docker Compose Plugin...'
                // Syntaxe correcte pour le plugin Compose : docker compose
                sh '/usr/bin/docker compose up -d --build'
            }
        }
    }
    
    post {
        success { echo 'DayFlow est en ligne !' }
        failure { echo 'Le déploiement a échoué.' }
    }
}