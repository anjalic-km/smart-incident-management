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
                bat 'cd backend && mvn clean package'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'cd frontend && npm install'
                bat 'cd frontend && npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t smart-incident .'
            }
        }

    }
}