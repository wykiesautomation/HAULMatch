from app.pricing import calculate
def test_bands():
 assert calculate(80,"Shared Load","4-ton")[0]==1
 assert calculate(620,"Shared Load","8-ton")[0]==3
 assert calculate(1635,"Full Load","Superlink")[0]==5
