
FROM python:3.12-alpine

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

COPY . /code

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

CMD ["uvicorn","main:app", "--host", "0.0.0.0", "--port", "8000"]
