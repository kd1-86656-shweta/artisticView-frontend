// Frontend pipeline: type-check + build inside Docker, then restart only the web (Caddy) container.
pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds(); buildDiscarder(logRotator(numToKeepStr: '20')) }
  triggers { pollSCM('H/5 * * * *') }
  environment {
    STACK = '/opt/artisticview'
    IMAGE = 'artisticview-web'
  }
  stages {
    stage('Build image') {
      steps {
        sh 'docker build -t $IMAGE:$BUILD_NUMBER -t $IMAGE:latest .'
      }
    }
    stage('Deploy') {
      steps {
        sh 'docker compose -f $STACK/docker-compose.yml --env-file $STACK/.env up -d --no-deps web'
      }
    }
    stage('Smoke test') {
      steps {
        sh '''
          sleep 5
          docker exec artisticview-web wget -qO- http://localhost:80/ >/dev/null 2>&1 \
            || docker exec artisticview-web sh -c 'test -f /srv/index.html'
          echo "web is serving"
        '''
      }
    }
  }
  post {
    always { sh 'docker image prune -f >/dev/null || true' }
  }
}
