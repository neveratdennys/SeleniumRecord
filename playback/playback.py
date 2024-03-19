import base64
import sys
import os
import glob
import tkinter as tk
import subprocess
from tkinter import messagebox
from pathlib import Path
from os import listdir
from os.path import isfile, join

# Track time
import time

code = base64.b64encode(b"""

# playback.py

# run node with params
def nodePlayback(name, cred):
    command = f"node {name} {cred[0]} {cred[1]}"
    try:
        # Run the command in PowerShell
        subprocess.run(["powershell", "-Command", command], check=True)
    except subprocess.CalledProcessError as e:
        # Handle the error
        print(f"An error occurred while running the command: {e}")
    except Exception as e:
        # Handle other exceptions
        print(f"An unexpected error occurred: {e}")



# Main function called on button press
def makeScript(files, varlist, root, cred, username_entry, password_entry):
    # Retreive usr pwd
    cred[0] = username_entry.get()
    cred[1] = password_entry.get()
    if not cred[0] and not cred[1]:
        tk.messagebox.showinfo(title="Notice", message="Login failed. Please check your credentials.")
        return

    # Track time on button press
    start_time = time.time()
    selected = [files[x] for x in range(len(files)) if varlist[x].get()]
    # Get current dir
    current = os.getcwd()

    # Run Node command
    if selected:
        # pass each file into node command
        for name in selected:
            nodePlayback(name, cred)

        print("Playback Complete")
        tk.messagebox.showinfo(title="Notice", message="Playback completed in " + str(round(time.time() - start_time, 2)) + "seconds")
    else:
        print("No files selected")
        tk.messagebox.showinfo(title="Notice", message="No files selected")

    root.quit()

# Get current directories
files = [file for file in os.listdir('.') if file.endswith('.js')]
height = 250 + 50 * len(files)

# GUI Selection
root = tk.Tk()
root.title('UDP Playback tool')
root.geometry(f"600x{height}")

w = tk.Label(root, text ='Playback selected scripts', font = "50")
w.pack()

# Make checkbox
varlist = []
for x in range(len(files)):
    varlist.append(tk.IntVar())
    l = tk.Checkbutton(root, text = files[x],
            variable = varlist[x],
            onvalue = 1,
            offvalue = 0,
            height = 3,
            width = 20,
            anchor = "w")
    l.pack()

    # Select number prefix by default
    if files[x][0].isdigit():
        l.select()

# Add text boxes for username and password
username_label = tk.Label(root, text="Unity Login")
username_label = tk.Label(root, text="Username:")
username_label.pack()
username_entry = tk.Entry(root)
username_entry.pack()

password_label = tk.Label(root, text="Password:")
password_label.pack()
password_entry = tk.Entry(root, show="*")
password_entry.pack()

# Credentials array
cred = [None, None]

# Run button calls function
default_bg = root.cget('bg')
B = tk.Button(root, text = "Play", command = lambda: makeScript(files, varlist, root, cred, username_entry, password_entry), height = 1, width = 10, bg='#1565c0', fg=default_bg)
B.pack(pady=10)

root.mainloop()

""")

exec(base64.b64decode(code))
