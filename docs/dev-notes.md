# Development Notes

## How to publish the package to GitHub?

Basically:
  1. Create access token with all package rights  
     See: https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line
  2. Use the access token in combination with user name
     See: https://help.github.com/pt/packages/using-github-packages-with-your-projects-ecosystem/configuring-gradle-for-use-with-github-packages
  3. Run `gradle publishMavenPublicationToGithubPackagesRepository`
  4. Later use as follows: https://stackoverflow.com/questions/57373192/how-to-add-github-package-registry-package-as-a-gradle-dependency?rq=1
  
***BUT*** It seems to be impossible to publish and use SNAPSHOT releases, since:
  1. First time publishing works
  2. Second time fails with `Could not GET ...-SNAPSHOT/maven-metadata.xml'. Received status code 400 from server: Bad Request`
  3. Also trying to consume such a package leads to exactly the same error
  
Possible hints of this issue:
  - https://github.community/t5/GitHub-API-Development-and/GitHub-package-registry-as-Maven-repo-trouble-uploading-artifact/td-p/28832/page/3
  
Currently not using SNAPSHOTS as a work-around.
