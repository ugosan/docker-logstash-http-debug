FROM jfloff/alpine-python:3.6

COPY ./debugserver.py /debugserver.py
COPY ./requirements.txt /requirements.txt

RUN pip install -r requirements.txt

EXPOSE 9000

ENV PYTHONUNBUFFERED=1

CMD [ "python", "debugserver.py" ]
