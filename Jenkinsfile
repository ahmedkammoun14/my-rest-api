pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'my-rest-api'
        DOCKER_HUB_USERNAME = 'ahmedkammoun14'
        K8S_NAMESPACE = 'production'
        // ✅ AJOUT: Détecter la branche
        GIT_BRANCH_NAME = "${env.GIT_BRANCH?.replaceAll('origin/', '') ?: 'unknown'}"
    }
    
    tools {
        nodejs 'NodeJS 18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // ✅ AJOUT: Afficher la branche détectée
                script {
                    echo "Current branch: ${env.GIT_BRANCH}"
                    echo "Normalized branch: ${GIT_BRANCH_NAME}"
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Security Audit') {
            steps {
                sh 'npm audit --audit-level=moderate || exit 0'
            }
        }
        
        stage('Build Docker Image') {
            when {
                // ✅ CHANGEMENT: Nouvelle condition
                expression { 
                    return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' 
                }
            }
            steps {
                script {
                    echo "🐳 Building Docker image..."
                    docker.build("${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE}:latest")
                }
            }
        }
        
        stage('Push to Docker Hub') {
            when {
                // ✅ CHANGEMENT: Nouvelle condition
                expression { 
                    return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' 
                }
            }
            steps {
                script {
                    echo "📤 Pushing to Docker Hub..."
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        docker.image("${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE}:latest").push()
                        docker.image("${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE}:latest").push("${env.BUILD_NUMBER}")
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                // ✅ CHANGEMENT: Nouvelle condition
                expression { 
                    return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' 
                }
            }
            steps {
                script {
                    echo "☸️ Deploying to Kubernetes..."
                    withKubeConfig([credentialsId: 'kubeconfig']) {
                        // Créer le namespace
                        sh 'kubectl apply -f k8s/namespace.yaml || exit 0'
                        
                        // Créer le secret de base de données
                        withCredentials([string(credentialsId: 'db-password', variable: 'DB_PASSWORD')]) {
                            sh '''
                                kubectl create secret generic db-secret \
                                --from-literal=password=$DB_PASSWORD \
                                -n $K8S_NAMESPACE \
                                --dry-run=client -o yaml | kubectl apply -f -
                            '''
                        }
                        
                        // Appliquer les configurations
                        sh 'kubectl apply -f k8s/configmap.yaml'
                        sh 'kubectl apply -f k8s/postgres-pvc.yaml'
                        sh 'kubectl apply -f k8s/postgres-deployment.yaml'
                        
                        // Attendre que PostgreSQL soit prêt
                        sh 'kubectl wait --for=condition=ready pod -l app=postgres -n $K8S_NAMESPACE --timeout=120s'
                        
                        // Déployer l'API REST
                        sh 'kubectl apply -f k8s/deployment.yaml'
                        sh 'kubectl apply -f k8s/service.yaml'
                        
                        // Redémarrer le déploiement
                        sh 'kubectl rollout restart deployment/rest-api-deployment -n $K8S_NAMESPACE'
                        
                        // Attendre que le déploiement soit terminé
                        sh 'kubectl rollout status deployment/rest-api-deployment -n $K8S_NAMESPACE --timeout=5m'
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            when {
                // ✅ CHANGEMENT: Nouvelle condition
                expression { 
                    return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' 
                }
            }
            steps {
                script {
                    echo "✅ Verifying deployment..."
                    withKubeConfig([credentialsId: 'kubeconfig']) {
                        sh 'kubectl get pods -n $K8S_NAMESPACE'
                        sh 'kubectl get services -n $K8S_NAMESPACE'
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