# my-rest-api
REST API with CI/CD pipeline
# 🚀 REST API with CI/CD Pipeline

![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-326CE5?logo=kubernetes&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)

A production-ready REST API with automated CI/CD pipeline, containerization, and Kubernetes orchestration. This project demonstrates modern DevOps practices including automated testing, Docker containerization, and deployment to Kubernetes (Minikube).

## ✨ Features

- **RESTful API** - Full CRUD operations for user management
- **PostgreSQL Database** - Persistent data storage with connection pooling
- **Docker Containerization** - Fully containerized application
- **Kubernetes Deployment** - Production-ready K8s manifests
- **CI/CD Pipeline** - Automated testing, building, and deployment with GitHub Actions
- **Automated Testing** - Unit tests with Jest and integration tests
- **Code Quality** - ESLint for code linting and formatting
- **Security Auditing** - Automated npm security audits
- **Self-hosted Runner** - Custom GitHub Actions runner for local deployment
- **Health Monitoring** - Kubernetes readiness and liveness probes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              GitHub Actions CI/CD                     │   │
│  │  • Test → Build → Deploy → Notify                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │  Docker Hub    │
                   │  (Image Store) │
                   └────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Minikube Kubernetes Cluster                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Namespace: production                               │   │
│  │                                                       │   │
│  │  ┌──────────────┐        ┌──────────────┐          │   │
│  │  │  PostgreSQL  │←───────│   REST API   │          │   │
│  │  │  Deployment  │        │  Deployment  │          │   │
│  │  │              │        │              │          │   │
│  │  │  • PVC       │        │  • ConfigMap │          │   │
│  │  │  • Secret    │        │  • Secret    │          │   │
│  │  └──────────────┘        └──────────────┘          │   │
│  │                                  ↓                   │   │
│  │                          ┌──────────────┐           │   │
│  │                          │   Service    │           │   │
│  │                          │  (NodePort)  │           │   │
│  │                          └──────────────┘           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘