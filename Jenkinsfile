pipeline {
    agent any

    stages {

        

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
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-new',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {
            bat 'docker login -u %DOCKER_USER% -p %DOCKER_PASS%'           
            bat 'docker push anjalicn/smart-incident-backend:1.0'
            bat 'docker push anjalicn/smart-incident-frontend:1.0'
            bat 'docker logout'
        }
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