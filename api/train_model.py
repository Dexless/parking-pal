import random
from datetime import datetime, timedelta
from pydantic import BaseModel
import pandas as pd
import matplotlib.pyplot as plt
import math
import os
    
class Day(BaseModel):
    day: list[float]
    date: datetime

SEED = [0.2, 0.8, 0.5, 0.7, 0.8, 0.95, 0.9, 0.7, 0.8, 0.7, 0.5, 0.4, 0.25, 0.1]
MAX_VAR = 0.05
HOURS = ['7AM', '8AM', '9AM', '10AM', '11AM', '12PM',
         '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM']

def simulate_day(seed, variance, count, date_seed = datetime.now()) -> list[Day]:
    days = []
    current_date = date_seed

    while len(days) < count:
        if current_date.weekday() < 5:  # Mon-Fri only
            day_data = [max(0, min(1, x + random.uniform(-variance, variance)))for x in seed]
            days.append(Day(day=day_data, date=current_date))
        current_date += timedelta(days=1)

    return days

def graphing_test(days: list[Day]):
        # Dynamic subplot layout
        n = len(days)
        cols = 2
        rows = math.ceil(n / cols)

        fig, axes = plt.subplots(rows, cols, figsize=(18, rows * 3.5), sharex=True, sharey=True)
        axes = axes.flatten() if n > 1 else [axes]

        for i, day in enumerate(df.index):
            bars = axes[i].bar(df.columns, df.loc[day], color='red')
            axes[i].set_title(day)
            axes[i].set_ylim(0, 1)
            axes[i].tick_params(axis='x', rotation=45)
            axes[i].grid(axis='y', linestyle='--', alpha=0.5)
            axes[i].bar_label(bars, fmt='%.2f', padding=3, fontsize=8)

        # Hide any extra unused subplots
        for i in range(n, len(axes)):
            axes[i].axis('off')

        fig.suptitle(f'Simulated Occupancy Over Time for {n} Days', fontsize=16)
        fig.supxlabel('Time of Day')
        fig.supylabel('Occupancy (0 to 1)')
        plt.tight_layout()
        plt.show()

if __name__ == "__main__":
    # simulate X days and write to csv, if csv exists, append to it instead of overwriting
    if os.path.exists('simulated_parking_data.csv'):
        print("File 'simulated_parking_data.csv' already exists. Appending new data to it.")

        existing_df = pd.read_csv('simulated_parking_data.csv', index_col=0)
        last_date = datetime.strptime(existing_df.index[-1], '%Y-%m-%d')
        new_start_date = last_date + timedelta(days=1)

        print("Starting at day:", new_start_date.strftime('%Y-%m-%d'))

        new_days = simulate_day(SEED, MAX_VAR, 1000, new_start_date)
        new_df = pd.DataFrame({day.date.strftime('%Y-%m-%d'): day.day for day in new_days}).T
        new_df.to_csv('simulated_parking_data.csv', mode='a', header=False)
    else:
        print("File 'simulated_parking_data.csv' does not exist. Creating new file and writing data to it.")
        print("Starting at day:", datetime.now().strftime('%Y-%m-%d'))

    df_dict = {}
    days = simulate_day(SEED, MAX_VAR, 1000)
    for day in days:
        formatted_date = day.date.strftime('%Y-%m-%d')
        df_dict[formatted_date] = day.day

    df = pd.DataFrame(df_dict, index=HOURS).T
    df = df.reset_index(names='date')
    df.to_csv('simulated_parking_data.csv', index=False)  # CSV columns are: date, 7AM, 8AM, ...
