import tkinter as tk
from tkinter import messagebox
import re

# COLORS 
BG_COLOR = "#0f1117"
CARD_COLOR = "#1a1c23"
ENTRY_COLOR = "#2a2d35"
BTN_PRIMARY = "#3a7afe"
TEXT_COLOR = "#e5e5e5"
SUBTEXT_COLOR = "#9a9aa0"

# USERS (with email)
users = {
    "abby": {"password": "Abby@123", "email": "abby@email.com"}
}

# PASSWORD CHECK 
def check_password_strength(password):
    score = 0
    suggestions = []

    if len(password) >= 8: score += 1
    else: suggestions.append("At least 8 characters")

    if re.search(r'[A-Z]', password): score += 1
    else: suggestions.append("Add uppercase")

    if re.search(r'[a-z]', password): score += 1
    else: suggestions.append("Add lowercase")

    if re.search(r'\d', password): score += 1
    else: suggestions.append("Add number")

    if re.search(r'[!@#$%^&*]', password): score += 1
    else: suggestions.append("Add symbol")

    return score >= 4, suggestions

# WINDOW 
window = tk.Tk()
window.title("Parking Pal")
window.geometry("1100x650")
window.configure(bg=BG_COLOR)

# NAVIGATION 
def hide_all():
    for f in (login_frame, register_frame, forgot_frame,
              home_frame, about_frame, lot_frame, map_frame):
        f.pack_forget()

def show_login():
    hide_all()
    login_frame.pack(fill="both", expand=True)

def show_register():
    hide_all()
    register_frame.pack(fill="both", expand=True)

def show_home():
    hide_all()
    home_frame.pack(fill="both", expand=True)

def show_about():
    hide_all()
    about_frame.pack(fill="both", expand=True)

def show_lot():
    hide_all()
    lot_frame.pack(fill="both", expand=True)

def show_map():
    hide_all()
    map_frame.pack(fill="both", expand=True)

def show_forgot():
    hide_all()
    forgot_frame.pack(fill="both", expand=True)

# AUTH
def login():
    u = login_username.get()
    p = login_password.get()

    if u in users and users[u]["password"] == p:
        show_home()
    else:
        messagebox.showerror("Error", "Invalid login")

def create_account():
    u = reg_username.get()
    p = reg_password.get()
    e = reg_email.get()

    if u in users:
        messagebox.showerror("Error", "User exists")
        return

    valid, fb = check_password_strength(p)
    if not valid:
        messagebox.showwarning("Weak Password", "\n".join(fb))
        return

    users[u] = {"password": p, "email": e}
    messagebox.showinfo("Success", "Account created")
    show_login()

# FORGOT PASSWORD
def send_reset_link():
    email = forgot_email.get()

    for user, data in users.items():
        if data["email"] == email:
            messagebox.showinfo(
                "Email Sent",
                f"Reset link sent to {email} (simulated)"
            )
            return

    messagebox.showerror("Error", "Email not found")

def reset_password():
    email = forgot_email.get()
    new_password = forgot_password.get()

    for user, data in users.items():
        if data["email"] == email:

            valid, feedback = check_password_strength(new_password)
            if not valid:
                messagebox.showwarning("Weak Password", "\n".join(feedback))
                return

            users[user]["password"] = new_password
            messagebox.showinfo("Success", "Password updated!")
            show_login()
            return

    messagebox.showerror("Error", "Email not found")

def logout():
    login_username.delete(0, tk.END)
    login_password.delete(0, tk.END)
    show_login()

# NAVBAR
def navbar(parent):
    nav = tk.Frame(parent, bg=BG_COLOR)
    nav.pack(fill="x")

    tk.Label(nav, text="PARKING PAL",
             font=("Segoe UI", 14, "bold"),
             bg=BG_COLOR, fg=TEXT_COLOR).pack(side="left", padx=20)

    tk.Button(nav, text="Logout", command=logout,
              bg=BG_COLOR, fg="#ff4d4d",
              relief="flat").pack(side="right", padx=10)

    for text, cmd in [("Home", show_home),
                      ("Map", show_map),
                      ("Lots", show_lot),
                      ("About", show_about)]:
        tk.Button(nav, text=text, command=cmd,
                  bg=BG_COLOR, fg=TEXT_COLOR,
                  relief="flat").pack(side="right", padx=10)

# FORGOT FRAME
forgot_frame = tk.Frame(window, bg=BG_COLOR)

tk.Label(forgot_frame, text="Reset Password",
         font=("Segoe UI", 26, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=40)

tk.Label(forgot_frame, text="Email", bg=BG_COLOR, fg=SUBTEXT_COLOR).pack()
forgot_email = tk.Entry(forgot_frame, bg=ENTRY_COLOR, fg=TEXT_COLOR)
forgot_email.pack(pady=10, ipadx=100, ipady=8)

tk.Label(forgot_frame, text="New Password", bg=BG_COLOR, fg=SUBTEXT_COLOR).pack()
forgot_password = tk.Entry(forgot_frame, show="*", bg=ENTRY_COLOR, fg=TEXT_COLOR)
forgot_password.pack(pady=10, ipadx=100, ipady=8)

tk.Button(forgot_frame, text="Send Reset Link",
          bg=BTN_PRIMARY, fg="white",
          command=send_reset_link).pack(pady=10)

tk.Button(forgot_frame, text="Reset Password",
          bg=BTN_PRIMARY, fg="white",
          command=reset_password).pack(pady=10)

tk.Button(forgot_frame, text="Back",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=show_login).pack()

# LOGIN FRAME
login_frame = tk.Frame(window, bg=BG_COLOR)

tk.Label(login_frame, text="PARKING PAL",
         font=("Segoe UI", 34, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=60)

tk.Label(login_frame, text="Username", bg=BG_COLOR, fg=TEXT_COLOR).pack()
login_username = tk.Entry(login_frame, bg=ENTRY_COLOR, fg=TEXT_COLOR)
login_username.pack(pady=10, ipadx=100, ipady=8)

tk.Label(login_frame, text="Password", bg=BG_COLOR, fg=TEXT_COLOR).pack()
login_password = tk.Entry(login_frame, show="*", bg=ENTRY_COLOR, fg=TEXT_COLOR)
login_password.pack(pady=10, ipadx=100, ipady=8)

tk.Button(login_frame, text="LOGIN", bg=BTN_PRIMARY, fg="white",
          command=login).pack(pady=15)

tk.Button(login_frame, text="Create Account",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=show_register).pack()

tk.Button(login_frame, text="Forgot Password",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=show_forgot).pack()

# REGISTER FRAME
register_frame = tk.Frame(window, bg=BG_COLOR)

tk.Label(register_frame, text="Create Account",
         font=("Segoe UI", 26, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=40)

tk.Label(register_frame, text="Username", bg=BG_COLOR, fg=TEXT_COLOR).pack()
reg_username = tk.Entry(register_frame, bg=ENTRY_COLOR, fg=TEXT_COLOR)
reg_username.pack(pady=10, ipadx=100, ipady=8)

tk.Label(register_frame, text="Email", bg=BG_COLOR, fg=TEXT_COLOR).pack()
reg_email = tk.Entry(register_frame, bg=ENTRY_COLOR, fg=TEXT_COLOR)
reg_email.pack(pady=10, ipadx=100, ipady=8)

tk.Label(register_frame, text="Password", bg=BG_COLOR, fg=TEXT_COLOR).pack()
reg_password = tk.Entry(register_frame, show="*", bg=ENTRY_COLOR, fg=TEXT_COLOR)
reg_password.pack(pady=10, ipadx=100, ipady=8)

tk.Button(register_frame, text="CREATE",
          bg=BTN_PRIMARY, fg="white",
          command=create_account).pack(pady=15)

tk.Button(register_frame, text="Back",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=show_login).pack()

# HOME
home_frame = tk.Frame(window, bg=BG_COLOR)
navbar(home_frame)

tk.Label(home_frame, text="PARKING PAL",
         font=("Segoe UI", 42, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(anchor="w", padx=40, pady=30)

tk.Label(home_frame,
         text="Real-time parking availability with precision.",
         bg=BG_COLOR, fg=SUBTEXT_COLOR).pack(anchor="w", padx=40)

# ABOUT
about_frame = tk.Frame(window, bg=BG_COLOR)
navbar(about_frame)

tk.Label(about_frame, text="About Parking Pal",
         font=("Segoe UI", 32, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=40)

tk.Label(about_frame,
         text="Find parking fast and efficiently.",
         bg=BG_COLOR, fg=SUBTEXT_COLOR).pack()

# LOT
lot_frame = tk.Frame(window, bg=BG_COLOR)
navbar(lot_frame)

tk.Label(lot_frame, text="LOT P01",
         font=("Segoe UI", 32, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=40)

# MAP
map_frame = tk.Frame(window, bg=BG_COLOR)
navbar(map_frame)

canvas = tk.Canvas(map_frame, bg="#111217")
canvas.pack(fill="both", expand=True)

canvas.create_oval(550, 300, 560, 310, fill="red")
canvas.create_text(555, 280, text="YOUR CAR", fill="white")

# START
show_login()
window.mainloop()
