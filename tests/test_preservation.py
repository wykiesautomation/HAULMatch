from pathlib import Path
REQUIRED=['app/routing/provider.py','app/routing/tokens.py','app/pricing.py','app/operations.py','app/payfast.py','app/commerce.py','app/production.py','app/storage.py','Dockerfile','docker-compose.production.yml']
def test_cumulative_modules_present():
 root=Path(__file__).parents[1]
 assert all((root/x).exists() for x in REQUIRED)
