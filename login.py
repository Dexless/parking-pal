import tkinter as tk 
from tkinter import messagebox


VALID_USERNAME = "abby"
VALID_PASSWORD = "1234"

def login():
    username = entry_username.get()
    password = entry_password.get()
    
    if username == VALID_USERNAME and password == VALID_PASSWORD:
        messagebox.showinfo("Login Successful", "Welcome to Parking Pal")
    else:
        messagebox.showerror("Login Failed", "Invalid username or password")
    

#main window
window = tk.TK()
window.title("App Login")
window.geometry("300x220")
window.resizable(False, False)

#Title

label_title = tk.Label(window, text="Login", font(Arial, 18))
label_title.pack(pady=10)

#Username
label_username = tk.Label(window, text="Username")
label_username.pack()
entry_username = tk.Entry(window)
entry_username.pack(pady=5)

#password
