# docker-logstash-http-debug

Starting the listening webserver
```
docker run --name logstash-debug -p 9000:9000 ugosan/logstash-http-debug:latest
```

Starting the console
```
docker exec -it logstash-debug /console.sh 
```