# Use Python 3.9 image (Stable and works well with Pandas/LangChain)
FROM python:3.9

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first (for better caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of your application code
COPY . .

# Create a writable directory for uploads (Hugging Face specific permission fix)
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Hugging Face Spaces expects the app to run on port 7860
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "7860"]