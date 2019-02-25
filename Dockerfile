FROM python:3

COPY ./debugserver.py /debugserver.py

EXPOSE 9000

ENV PYTHONUNBUFFERED=1

CMD [ "python", "debugserver.py" ]