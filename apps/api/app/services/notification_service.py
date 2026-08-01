class NotificationService:
    async def send_eligibility_alert(self, recipient: str, message: str) -> None:
        _ = (recipient, message)
