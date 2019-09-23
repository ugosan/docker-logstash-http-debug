# docker-logstash-http-debug

This is a small docker image to help on coding pipelines for Logstash. It starts a webserver so you can `output` events to it, and provides a navigable console where you can inspect the pretty-printed events.


<kbd>![](/doc/termtosvg_n4dk2z59.svg)</kbd>


## Getting started

### Step 1: Add or change the `output` of your pipeline:

Use the name of the container as the domain (e.g. `logstash-debug`)
```
output {
    ...
    http {
        url => "http://logstash-debug:9000"
        http_method => "post"
    }
}
```

### Step 2: Start the container
Give it a very creative name such as `logstash-debug`:
```
docker run --name logstash-debug -p 9000:9000 ugosan/logstash-http-debug:latest
```

### Step 3: Start the console
On a different terminal, execute the `console.sh` to open up the UI
```
docker exec -it logstash-debug /console.sh 
```

