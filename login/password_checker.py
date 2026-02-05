import re

def check_password_strength(password):
    """
    Check the strength of a given password and provide feedback.
    """
    score = 0
    suggestions = []

    if len(password) >= 8:
        score += 1
    else:
        suggestions.append("Make the password at least 8 characters long")

    if re.search(r'[A-Z]', password):
        score += 1
    else:
        suggestions.append("Add uppercase letters")

    if re.search(r'[a-z]', password):
        score += 1
    else:
        suggestions.append("Add lowercase letters")

    if re.search(r'\d', password):
        score += 1
    else:
        suggestions.append("Add numbers")

    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        suggestions.append("Add special characters")

    if score == 5:
        return "Very Strong", []
    elif score == 4:
        return "Strong", []
    elif score == 3:
        return "Moderate", suggestions
    else:
        return "Weak", suggestions

# --- THE FIX IS BELOW ---
# Notice how this 'if' is all the way to the left now?
if __name__ == "__main__":
    print("--- Password Strength Checker ---")
    while True:
        user_pass = input("\nEnter a password to test (or 'q' to quit): ")

        if user_pass.lower() == 'q':
            print("Exiting...")
            break

        # We capture the result in variables so we can print them nicely
        strength, feedback = check_password_strength(user_pass)

        print(f"Result: {strength}")
        if feedback:
            print("Suggestions to improve:")
            for item in feedback:
                print(f" - {item}")
