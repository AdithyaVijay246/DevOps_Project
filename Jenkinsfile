pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Environment') {
            steps {
                sh 'node -v && npm -v'
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
            post {
                always {
                    junit testResults: 'junit.xml', allowEmptyResults: true
                }
            }
        }

        stage('Package') {
            steps {
                sh 'tar -czf hospital-appointment-poc.tar.gz src public package.json'
                archiveArtifacts artifacts: 'hospital-appointment-poc.tar.gz', fingerprint: true
            }
        }

        stage('Smoke Test (Deploy)') {
            steps {
                sh '''
                    PORT=3100 node src/server.js &
                    APP_PID=$!
                    sleep 3
                    curl -sf http://localhost:3100/health
                    STATUS=$?
                    kill $APP_PID
                    exit $STATUS
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded: lint, tests, package and smoke test all passed.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs above for details.'
        }
    }
}
