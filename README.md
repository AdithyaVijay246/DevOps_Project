# Hospital Appointment Booking System (PoC)

This is a small proof of concept. The app itself is simple on purpose; the point of the repo is the workflow around it: Git for version control and Jenkins for CI.

Patients pick a department and a doctor, see the open slots for a date, book one, and cancel if needed. The API rejects double bookings. Data is kept in memory, and the project has no npm dependencies (Node.js 20+ only), so the pipeline has nothing to download.

## Run locally

```bash
npm test     # 8 tests, also writes junit.xml
npm start    # http://localhost:3000
```

## Pipeline stages (Jenkinsfile)

1. Checkout: pulls the repo and prints the latest commit
2. Environment: prints the Node and npm versions
3. Lint: syntax check with `node --check`
4. Test: runs `npm test` and publishes the JUnit report
5. Package: builds `hospital-appointment-poc.tar.gz` and archives it with a fingerprint
6. Smoke Test (Deploy): starts the app on port 3100 and checks `/health` with curl

## Jenkins setup

1. Build and start Jenkins with Node.js preinstalled (needs Docker):

   ```bash
   docker build -t jenkins-node ./jenkins
   docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins-node
   docker logs jenkins   # copy the initial admin password from here
   ```

2. Open http://localhost:8080, paste the password to unlock Jenkins, choose "Install suggested plugins", and create the admin user.
3. Push this repo to GitHub:

   ```bash
   git remote add origin https://github.com/<your-user>/hospital-appointment-poc.git
   git push -u origin main
   ```

4. In Jenkins, click New Item, enter a name, choose Pipeline, and click OK. Under Pipeline, select "Pipeline script from SCM", set SCM to Git, paste the repo URL, set the branch to `*/main` and the script path to `Jenkinsfile`, then save.
5. Click Build Now. If you want every push to start a build, enable Poll SCM under Build Triggers with the schedule `H/2 * * * *`.

## Demo a failing build, then a fixed one

1. Break a test, for example by changing an expected value in `test/app.test.js`. Commit and push. The build goes red at the Test stage.
2. Revert the change, commit, and push again. The build goes green.
