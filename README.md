# docker-logstash-http-debug

This is a small docker image to help on coding pipelines for Logstash. It starts a webserver so you can `output` events to it, and provides a navigable console where you can inspect the pretty-printed events.


## Getting started

Step 1: Add or change the `output` of your pipeline:

```
output {
    ...
    http {
        url => "http://localhost:9000"
        http_method => "post"
    }
}
```

Note: if you are also running logstash inside a container, then `localhost` will not work, instead use `http://host.docker.internal:9000` as the url.

Step 2: Start the container
```
docker run --name logstash-debug -p 9000:9000 ugosan/logstash-http-debug:latest
```

Step 3: Start the console
```
docker exec -it logstash-debug /console.sh 
```

<kbd>![](/doc/termtosvg_j07g3s7r.svg)</kbd>

