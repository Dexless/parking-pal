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

users = {"abby": "Abby@123"}

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

#Rest Password
def reset_password():
    username = forgot_username.get()
    new_password = forgot_password.get()

    if username not in users:
        messagebox.showerror("Error", "User not found")
        return

    valid, feedback = check_password_strength(new_password)
    if not valid:
        messagebox.showwarning("Weak Password", "\n".join(feedback))
        return

    users[username] = new_password
    messagebox.showinfo("Success", "Password updated!")
    show_login()

# WINDOW 
window = tk.Tk()
window.title("Parking Pal")
window.geometry("1100x650")
window.configure(bg=BG_COLOR)

# NAVIGATION 
def hide_all():
    for f in (login_frame, register_frame, home_frame, about_frame, lot_frame, map_frame):
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

# Authentication 
def login():
    if login_username.get() in users and users[login_username.get()] == login_password.get():
        show_home()
    else:
        messagebox.showerror("Error", "Invalid login")

def create_account():
    u = reg_username.get()
    p = reg_password.get()

    if u in users:
        messagebox.showerror("Error", "User exists")
        return

    valid, fb = check_password_strength(p)
    if not valid:
        messagebox.showwarning("Weak Password", "\n".join(fb))
        return

    users[u] = p
    messagebox.showinfo("Success", "Account created")
    show_login()

def forgot():
    username = login_username.get()

    if username in users:
        messagebox.showinfo("Password Found", f"Password is: {users[username]}")
    else:
        messagebox.showerror("Error", "Username not found")

def logout():
    login_username.delete(0, tk.END)
    login_password.delete(0, tk.END)
    show_login()

#Forgot
forgot_frame = tk.Frame(window, bg=BG_COLOR)

tk.Label(forgot_frame, text="Reset Password",
         font=("Segoe UI", 26, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=40)

tk.Label(forgot_frame, text="Username",
         bg=BG_COLOR, fg=SUBTEXT_COLOR).pack()

forgot_username = tk.Entry(forgot_frame, bg=ENTRY_COLOR, fg=TEXT_COLOR)
forgot_username.pack(pady=10, ipady=8, ipadx=100)

tk.Label(forgot_frame, text="New Password",
         bg=BG_COLOR, fg=SUBTEXT_COLOR).pack()

forgot_password = tk.Entry(forgot_frame, show="*",
                           bg=ENTRY_COLOR, fg=TEXT_COLOR)
forgot_password.pack(pady=10, ipady=8, ipadx=100)
          
# LOGIN 
login_frame = tk.Frame(window, bg=BG_COLOR)

tk.Label(login_frame, text="PARKING PAL",
         font=("Segoe UI", 34, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=60)

tk.Label(login_frame,
         text="Username",
         font=("Segoe UI", 12, "bold"),
         bg=BG_COLOR,
         fg=TEXT_COLOR).pack()

login_username = tk.Entry(login_frame, bg=ENTRY_COLOR, fg=TEXT_COLOR)
login_username.pack(pady=10, ipady=8, ipadx=100)

tk.Label(login_frame,
         text="Password",
         font=("Segoe UI", 12, "bold"),
         bg=BG_COLOR,
         fg=TEXT_COLOR).pack()

login_password = tk.Entry(login_frame, show="*", bg=ENTRY_COLOR, fg=TEXT_COLOR)
login_password.pack(pady=10, ipady=8, ipadx=100)

tk.Button(login_frame, text="LOGIN", bg=BTN_PRIMARY, fg="white",
          command=login).pack(pady=15, ipadx=40, ipady=5)

tk.Button(login_frame, text="Create Account",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=show_register).pack()

tk.Button(login_frame, text="Forgot Password",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=forgot).pack()

tk.Button(forgot_frame, text="RESET PASSWORD",
          bg=BTN_PRIMARY, fg="white",
          command=reset_password).pack(pady=15)

tk.Button(forgot_frame, text="Back to Login",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=show_login).pack()



# REGISTER 
register_frame = tk.Frame(window, bg=BG_COLOR)

tk.Label(register_frame, text="Create Account",
         font=("Segoe UI", 26, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=40)

tk.Label(register_frame,
         text="Username",
         font=("Segoe UI", 12, "bold"),
         bg=BG_COLOR,
         fg=TEXT_COLOR).pack()


reg_username = tk.Entry(register_frame, bg=ENTRY_COLOR, fg=TEXT_COLOR)

reg_username.pack(pady=10, ipady=8, ipadx=100)
tk.Label(register_frame,
         text="Password",
         font=("Segoe UI", 12, "bold"),
         bg=BG_COLOR,
         fg=TEXT_COLOR).pack()

reg_password = tk.Entry(register_frame, show="*", bg=ENTRY_COLOR, fg=TEXT_COLOR)
reg_password.pack(pady=10, ipady=8, ipadx=100)


tk.Button(register_frame, text="CREATE",
          bg=BTN_PRIMARY, fg="white",
          command=create_account).pack(pady=15)

tk.Button(register_frame, text="Back",
          bg=BG_COLOR, fg=SUBTEXT_COLOR,
          command=show_login).pack()

# NAV BAR FUNCTION 
def navbar(parent):
    nav = tk.Frame(parent, bg=BG_COLOR)
    nav.pack(fill="x")

    tk.Label(nav, text="PARKING PAL",
             font=("Segoe UI", 14, "bold"),
             bg=BG_COLOR, fg=TEXT_COLOR).pack(side="left", padx=20)

    # Logout button (right side)
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
        
# HOME 
home_frame = tk.Frame(window, bg=BG_COLOR)
navbar(home_frame)

tk.Label(home_frame, text="PARKING PAL",
         font=("Segoe UI", 42, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(anchor="w", padx=40, pady=30)

tk.Label(home_frame,
         text="Real-time parking availability with precision.",
         font=("Segoe UI", 12),
         bg=BG_COLOR, fg=SUBTEXT_COLOR).pack(anchor="w", padx=40)

tk.Button(home_frame, text="OPEN MAP →",
          bg=BTN_PRIMARY, fg="white",
          command=show_map).pack(padx=40, pady=20, anchor="w")

# ABOUT 
about_frame = tk.Frame(window, bg=BG_COLOR)
navbar(about_frame)

tk.Label(about_frame, text="About Parking Pal",
         font=("Segoe UI", 32, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(pady=40)

tk.Label(about_frame,
         text="Parking Pal helps you find and track parking in real-time.\n\nBuilt for smart campuses and urban navigation.\n\nFast. Accurate. Reliable.",
         font=("Segoe UI", 12),
         bg=BG_COLOR, fg=SUBTEXT_COLOR,
         justify="center").pack()

# LOT 
lot_frame = tk.Frame(window, bg=BG_COLOR)
navbar(lot_frame)

tk.Label(lot_frame, text="LOT P01",
         font=("Segoe UI", 32, "bold"),
         bg=BG_COLOR, fg=TEXT_COLOR).pack(anchor="w", padx=20, pady=20)

stats = tk.Frame(lot_frame, bg=BG_COLOR)
stats.pack(padx=20, fill="x")

def card(parent, title, value):
    c = tk.Frame(parent, bg=CARD_COLOR, padx=20, pady=20)
    c.pack(side="left", expand=True, fill="both", padx=10)

    tk.Label(c, text=title, bg=CARD_COLOR,
             fg=SUBTEXT_COLOR).pack(anchor="w")

    tk.Label(c, text=value,
             bg=CARD_COLOR, fg=TEXT_COLOR,
             font=("Segoe UI", 18, "bold")).pack(anchor="w")

card(stats, "Capacity", "1,250")
card(stats, "Occupied", "812")
card(stats, "EV Chargers", "42")

# MAP 
map_frame = tk.Frame(window, bg=BG_COLOR)
navbar(map_frame)

canvas = tk.Canvas(map_frame, bg="#111217", highlightthickness=0)
canvas.pack(fill="both", expand=True)

# GRID (more dense = nicer look)
for i in range(0, 1200, 40):
    canvas.create_line(i, 0, i, 800, fill="#1c1f26")
    canvas.create_line(0, i, 1200, i, fill="#1c1f26")

# CAR
canvas.create_oval(550, 300, 560, 310, fill="red")
canvas.create_text(555, 280, text="YOUR CAR", fill="white")

# BOTTOM BAR
bottom = tk.Frame(map_frame, bg="#2a2d35")
bottom.pack(fill="x")

tk.Label(bottom,
         text="Vehicle Secured | Row G, Section 04",
         bg="#2a2d35", fg=TEXT_COLOR).pack(side="left", padx=10)

tk.Button(bottom, text="UPDATE", bg=BTN_PRIMARY, fg="white").pack(side="right", padx=5)
tk.Button(bottom, text="DELETE", bg="#d32f2f", fg="white").pack(side="right")

# START 
show_login()
window.mainloop()