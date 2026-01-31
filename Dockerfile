# UPDATE: Changed to Python 3.10 to support newer libraries
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of your application code
COPY . .

# Create a writable directory for uploads
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Hugging Face Spaces expects the app to run on port 7860
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "7860"]