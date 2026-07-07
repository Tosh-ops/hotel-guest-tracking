from django.shortcuts import render

# Create your views here.
import os
import json
from dotenv import load_dotenv
from anthropic import Anthropic
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@csrf_exempt
def chatbot_reply(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_message = data.get("message", "")

        try:
            response = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=300,
                system="You are a friendly hotel booking assistant. Help guests with room availability, bookings, and general hotel questions. Keep answers short and clear.",
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            reply_text = response.content[0].text

        except Exception as e:
            # Fallback demo reply if API credit/connection fails
            reply_text = (
                "Thanks for reaching out! I'm having a little trouble connecting right now, "
                "but our front desk team would be happy to help you with that in the meantime."
            )

        return JsonResponse({"reply": reply_text})

    return JsonResponse({"error": "Only POST allowed"}, status=400)