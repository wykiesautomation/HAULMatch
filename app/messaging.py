import os
class DeliveryProvider:
 def send_email(self,to,subject,body):raise NotImplementedError
 def send_sms(self,to,body):raise NotImplementedError
class ConsoleDeliveryProvider(DeliveryProvider):
 def send_email(self,to,subject,body):print(f'[EMAIL DEV] {to} | {subject} | {body}')
 def send_sms(self,to,body):print(f'[SMS DEV] {to} | {body}')
def provider():return ConsoleDeliveryProvider()
