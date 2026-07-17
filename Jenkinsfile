pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                bat 'cd backend && mvn clean package -DskipTests'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'cd frontend && npm install'
                bat 'cd frontend && npm run build'
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Run Docker Containers') {
            steps {
                bat 'docker compose up -d'
            }
        }

    }

    post {
        success {
            echo 'Pipeline executed successfully!'
        }

        failure {
            echo 'Pipeline execution failed.'
        }
    }
}