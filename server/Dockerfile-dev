FROM python:3.9-alpine
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
EXPOSE 3000
ADD ./requirements.txt /app/requirements.txt
RUN apk add --no-cache gcc libc-dev linux-headers musl-dev
RUN apk add --no-cache --virtual .build-deps postgresql-dev
RUN pip install uwsgi
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

CMD ["uwsgi", "--ini", "uwsgi.ini", \
    "--socket", ":3000", \
    "--plugins", "python3"]