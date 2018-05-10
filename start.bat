set NODE_ENV=local
cd /d %~dp0
START npm run test
START gulp
"C:\Program Files\MongoDB\Server\3.4\bin\mongod.exe" --dbpath "C:\MongoDB"