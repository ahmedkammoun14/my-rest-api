pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'my-rest-api'
        DOCKER_HUB_USERNAME = 'ahmedkammoun14'
        K8S_NAMESPACE = 'production'
    }
    
    tools {
        nodejs 'NodeJS 18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }
        
        stage('Lint') {
            steps {
                bat 'npm run lint'
            }
        }
        
        stage('Test') {
            steps {
                bat 'npm test'
            }
        }
        
        stage('Security Audit') {
            steps {
                bat 'npm audit --audit-level=moderate || exit 0'
            }
        }
        
        stage('Build Docker Image') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.build("${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE}:latest")
                }
            }
        }
        
        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        docker.image("${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE}:latest").push()
                        docker.image("${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE}:latest").push("${env.BUILD_NUMBER}")
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig-jenkins.yaml']) {
                        // Create namespace
                        bat 'kubectl apply -f k8s/namespace.yaml || exit 0'
                        
                        // Create secret
                        withCredentials([string(credentialsId: 'db-password', variable: 'DB_PASSWORD')]) {
                            bat """
                                kubectl create secret generic db-secret ^
                                --from-literal=password=%DB_PASSWORD% ^
                                -n %K8S_NAMESPACE% ^
                                --dry-run=client -o yaml | kubectl apply -f -
                            """
                        }
                        
                        // Apply configs
                        bat 'kubectl apply -f k8s/configmap.yaml'
                        bat 'kubectl apply -f k8s/postgres-pvc.yaml'
                        bat 'kubectl apply -f k8s/postgres-deployment.yaml'
                        
                        // Wait for PostgreSQL
                        bat 'kubectl wait --for=condition=ready pod -l app=postgres -n %K8S_NAMESPACE% --timeout=120s'
                        
                        // Deploy REST API
                        bat 'kubectl apply -f k8s/deployment.yaml'
                        bat 'kubectl apply -f k8s/service.yaml'
                        
                        // Restart deployment to pull latest image
                        bat 'kubectl rollout restart deployment/rest-api-deployment -n %K8S_NAMESPACE%'
                        
                        // Wait for deployment
                        bat 'kubectl rollout status deployment/rest-api-deployment -n %K8S_NAMESPACE% --timeout=5m'
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig-jenkins.yaml']) {
                        bat 'kubectl get pods -n %K8S_NAMESPACE%'
                        bat 'kubectl get services -n %K8S_NAMESPACE%'
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        always {
            cleanWs()
        }
    }
}