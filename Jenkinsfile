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
                bat 'docker build -t anjalicn/smart-incident-backend:1.0 backend'
                bat 'docker build -t anjalicn/smart-incident-frontend:1.0 frontend'
            }
        }

        stage('Push Docker Images') {
            steps {
                bat 'docker push anjalicn/smart-incident-backend:1.0'
                bat 'docker push anjalicn/smart-incident-frontend:1.0'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                bat 'kubectl apply -f k8s/postgres-deployment.yaml'
                bat 'kubectl apply -f k8s/postgres-service.yaml'

                bat 'kubectl apply -f k8s/backend-deployment.yaml'
                bat 'kubectl apply -f k8s/backend-service.yaml'

                bat 'kubectl apply -f k8s/frontend-deployment.yaml'
                bat 'kubectl apply -f k8s/frontend-service.yaml'
            }
        }

        stage('Verify Deployment') {
            steps {
                bat 'kubectl get pods'
                bat 'kubectl get services'
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