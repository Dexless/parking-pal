import tkinter as tk
from tkinter import messagebox
import re

# User Storage
users = {
    "abby": "Abby@123"
}

# Password Strength Checker
def check_password_strength(password):
    score = 0
    suggestions = []

    if len(password) >= 8:
        score += 1
    else:
        suggestions.append("At least 8 characters")

    if re.search(r'[A-Z]', password):
        score += 1
    else:
        suggestions.append("Add uppercase letter")

    if re.search(r'[a-z]', password):
        score += 1
    else:
        suggestions.append("Add lowercase letter")

    if re.search(r'\d', password):
        score += 1
    else:
        suggestions.append("Add number")

    if re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
        score += 1
    else:
        suggestions.append("Add special character")

    if score >= 4:
        return True, []
    else:
        return False, suggestions


# Page Switching Functions
def show_login():
    register_frame.pack_forget()
    login_frame.pack(fill="both", expand=True)


def show_register():
    login_frame.pack_forget()
    register_frame.pack(fill="both", expand=True)


# Login Function

def login():
    username = login_username.get()
    password = login_password.get()

    if username in users and users[username] == password:
        messagebox.showinfo("Success", f"Welcome {username}!")
    else:
        messagebox.showerror("Error", "Invalid username or password")


#Create Account Function
def create_account():
    username = reg_username.get()
    password = reg_password.get()

    if username in users:
        messagebox.showerror("Error", "Username already exists!")
        return

    valid, feedback = check_password_strength(password)

    if not valid:
        messagebox.showwarning(
            "Weak Password",
            "Password must include:\n" + "\n".join(feedback)
        )
        return

    users[username] = password
    messagebox.showinfo("Success", "Account created successfully!")
    show_login()
#Forgot Password
def forgot():
    username = login_username.get()

    if username in users:
        messagebox.showinfo("Password Found", f"Password is: {users[username]}")
    else:
        messagebox.showerror("Error", "Username not found")


# Main Window 
window = tk.Tk()
window.title("Parking Pal")
window.geometry("350x300")
window.resizable(False, False)

# LOGIN FRAME
login_frame = tk.Frame(window)

tk.Label(login_frame, text="Login", font=("Arial", 18)).pack(pady=10)

tk.Label(login_frame, text="Username").pack()
login_username = tk.Entry(login_frame)
login_username.pack(pady=5)

tk.Label(login_frame, text="Password").pack()
login_password = tk.Entry(login_frame, show="*")
login_password.pack(pady=5)

tk.Button(login_frame, text="Login", width=20, command=login).pack(pady=5)
tk.Button(login_frame, text="Create New Account", width=20, command=show_register).pack(pady=5)
tk.Button(login_frame, text="Forgot Password", width=20, command=forgot).pack(pady=5)



# REGISTER FRAME
register_frame = tk.Frame(window)

tk.Label(register_frame, text="Create Account", font=("Arial", 18)).pack(pady=10)

tk.Label(register_frame, text="New Username").pack()
reg_username = tk.Entry(register_frame)
reg_username.pack(pady=5)

tk.Label(register_frame, text="New Password").pack()
reg_password = tk.Entry(register_frame, show="*")
reg_password.pack(pady=5)

tk.Button(register_frame, text="Create Account", width=20, command=create_account).pack(pady=5)
tk.Button(register_frame, text="Back to Login", width=20, command=show_login).pack(pady=5)


# Start with login page
login_frame.pack(fill="both", expand=True)

window.mainloop()