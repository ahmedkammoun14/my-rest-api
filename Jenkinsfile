pipeline {
    agent any
    
    environment {
        // Docker Hub configuration
        DOCKER_HUB_USER = 'ahmedkammoun14'
        DOCKER_IMAGE = 'my-rest-api'
        DOCKER_TAG = "${BUILD_NUMBER}"
        
        // Kubernetes configuration
        K8S_NAMESPACE = 'production'
        
        // Credentials IDs (à créer dans Jenkins)
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
    }
    
    tools {
        // Utilise Node.js 18 (à configurer dans Jenkins)
        nodejs 'NodeJS 20'
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
                bat 'npm ci'
            }
        }
        
        stage('🔎 Run Linter') {
            steps {
                echo 'Running ESLint...'
                bat 'npm run lint'
            }
        }
        
        stage('🧪 Run Tests') {
            steps {
                echo 'Running Jest tests...'
                bat 'npm test'
            }
        }
        
        stage('🔒 Security Audit') {
            steps {
                echo 'Running npm security audit...'
                bat 'npm audit --audit-level=moderate || exit 0'
            }
        }
        
        stage('🐳 Build Docker Image') {
            when {
                branch 'main'
            }
            steps {
                echo 'Building Docker image...'
                script {
                    // Build avec plusieurs tags
                    bat "docker build -t ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} ."
                    bat "docker build -t ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest ."
                    bat "docker tag ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:main"
                }
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
                        bat """
                            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                            docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}
                            docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest
                            docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:main
                            docker logout
                        """
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
                        bat """
                            REM Create namespace if not exists
                            kubectl apply -f k8s/namespace.yaml --kubeconfig=%KUBECONFIG_FILE%
                            
                            REM Apply ConfigMaps
                            kubectl apply -f k8s/configmap.yaml --kubeconfig=%KUBECONFIG_FILE%
                            
                            REM Create/Update DB secret
                            kubectl create secret generic db-secret ^
                                --from-literal=password=password123 ^
                                -n %K8S_NAMESPACE% ^
                                --dry-run=client -o yaml ^
                                --kubeconfig=%KUBECONFIG_FILE% | kubectl apply -f - --kubeconfig=%KUBECONFIG_FILE%
                            
                            REM Deploy PostgreSQL
                            kubectl apply -f k8s/postgres-pvc.yaml --kubeconfig=%KUBECONFIG_FILE%
                            kubectl apply -f k8s/postgres-deployment.yaml --kubeconfig=%KUBECONFIG_FILE%
                            
                            REM Wait for PostgreSQL
                            kubectl wait --for=condition=ready pod -l app=postgres -n %K8S_NAMESPACE% --timeout=120s --kubeconfig=%KUBECONFIG_FILE%
                            
                            REM Deploy REST API
                            kubectl apply -f k8s/deployment.yaml --kubeconfig=%KUBECONFIG_FILE%
                            kubectl apply -f k8s/service.yaml --kubeconfig=%KUBECONFIG_FILE%
                            
                            REM Update image to force pull latest
                            kubectl set image deployment/rest-api-deployment ^
                                rest-api=${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} ^
                                -n %K8S_NAMESPACE% ^
                                --kubeconfig=%KUBECONFIG_FILE%
                            
                            REM Wait for rollout
                            kubectl rollout status deployment/rest-api-deployment -n %K8S_NAMESPACE% --timeout=5m --kubeconfig=%KUBECONFIG_FILE%
                        """
                    }
                }
            }
        }
        
        stage('✅ Verify Deployment') {
            when {
                branch 'main'
            }
            steps {
                echo 'Verifying Kubernetes deployment...'
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG_FILE')]) {
                        bat """
                            echo.
                            echo ========================================
                            echo   DEPLOYMENT STATUS
                            echo ========================================
                            
                            echo.
                            echo Pods:
                            kubectl get pods -n %K8S_NAMESPACE% --kubeconfig=%KUBECONFIG_FILE%
                            
                            echo.
                            echo Services:
                            kubectl get services -n %K8S_NAMESPACE% --kubeconfig=%KUBECONFIG_FILE%
                            
                            echo.
                            echo Deployments:
                            kubectl get deployments -n %K8S_NAMESPACE% --kubeconfig=%KUBECONFIG_FILE%
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up...'
            // Nettoyer les images Docker locales pour économiser l'espace
            bat "docker rmi ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} || exit 0"
            bat "docker rmi ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest || exit 0"
        }
        success {
            echo '========================================='
            echo '   ✅ DEPLOYMENT SUCCESSFUL!'
            echo '========================================='
            echo 'Build Number: ' + env.BUILD_NUMBER
            echo 'Docker Image: ' + env.DOCKER_HUB_USER + '/' + env.DOCKER_IMAGE + ':' + env.DOCKER_TAG
        }
        failure {
            echo '========================================='
            echo '   ❌ DEPLOYMENT FAILED!'
            echo '========================================='
            echo 'Check the logs above for details'
        }
    }
}