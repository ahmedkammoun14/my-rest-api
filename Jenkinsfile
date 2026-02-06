pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USER = 'ahmedkammoun14'
        DOCKER_IMAGE = 'my-rest-api'
        DOCKER_TAG = "${BUILD_NUMBER}"
        K8S_NAMESPACE = 'production'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
    }
    
    stages {
        stage('🔍 Checkout Code') {
            steps {
                echo 'Cloning repository...'
                checkout scm
            }
        }
        
        stage('📦 Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm ci'
            }
        }
        
        stage('🔎 Run Linter') {
            steps {
                echo 'Running ESLint...'
                sh 'npm run lint'
            }
        }
        
        stage('🧪 Run Tests') {
            steps {
                echo 'Running Jest tests...'
                sh 'npm test'
            }
        }
        
        stage('🔒 Security Audit') {
            steps {
                echo 'Running npm security audit...'
                sh 'npm audit --audit-level=moderate || true'
            }
        }
        
        stage('🐳 Build Docker Image') {
            when {
                branch 'main'
            }
            steps {
                echo 'Building Docker image...'
                sh """
                    docker build -t ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} .
                    docker tag ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest
                """
            }
        }
        
        stage('📤 Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                echo 'Pushing images to Docker Hub...'
                script {
                    withCredentials([usernamePassword(
                        credentialsId: DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                            docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}
                            docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest
                            docker logout
                        '''
                    }
                }
            }
        }
        
        stage('☸️ Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to Kubernetes...'
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG_FILE')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG_FILE}
                            
                            kubectl apply -f k8s/namespace.yaml
                            kubectl apply -f k8s/configmap.yaml
                            
                            kubectl create secret generic db-secret \
                                --from-literal=password=password123 \
                                -n ${K8S_NAMESPACE} \
                                --dry-run=client -o yaml | kubectl apply -f -
                            
                            kubectl apply -f k8s/postgres-pvc.yaml
                            kubectl apply -f k8s/postgres-deployment.yaml
                            kubectl wait --for=condition=ready pod -l app=postgres -n ${K8S_NAMESPACE} --timeout=120s || true
                            
                            kubectl apply -f k8s/deployment.yaml
                            kubectl apply -f k8s/service.yaml
                            
                            kubectl set image deployment/rest-api-deployment \
                                rest-api=${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} \
                                -n ${K8S_NAMESPACE}
                            
                            kubectl rollout status deployment/rest-api-deployment -n ${K8S_NAMESPACE} --timeout=5m
                        '''
                    }
                }
            }
        }
        
        stage('✅ Verify Deployment') {
            when {
                branch 'main'
            }
            steps {
                echo 'Verifying deployment...'
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG_FILE')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG_FILE}
                            echo ""
                            echo "========================================"
                            echo "   DEPLOYMENT STATUS"
                            echo "========================================"
                            echo ""
                            echo "Pods:"
                            kubectl get pods -n ${K8S_NAMESPACE}
                            echo ""
                            echo "Services:"
                            kubectl get services -n ${K8S_NAMESPACE}
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up Docker images...'
            sh """
                docker rmi ${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE}:${env.DOCKER_TAG} || true
                docker rmi ${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE}:latest || true
            """
        }
        success {
            echo '========================================='
            echo '   ✅ DEPLOYMENT SUCCESSFUL!'
            echo '========================================='
            echo "Build Number: ${env.BUILD_NUMBER}"
            echo "Docker Image: ${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE}:${env.DOCKER_TAG}"
        }
        failure {
            echo '========================================='
            echo '   ❌ DEPLOYMENT FAILED!'
            echo '========================================='
            echo 'Check the logs above for details'
        }
    }
}