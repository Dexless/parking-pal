# Parking Pal

[Link to Parking Pal Testing Documentation](https://docs.google.com/spreadsheets/d/1uBCT0pl8fy2EWj7oTAVGg5JiVK4HbAunM675UnKDHzk/edit?usp=sharing)

### Description:

Parking Pal is a comprehensive parking application to systematically store information regarding parking at institutions with impacted infrastructure.

### Scrum Cycle 1:

- Home Page
    - Show overview map of parking lots
    - Asset Collection
- Get input request from backend to frontend
    - Set up basic requests using FastAPI
    - Listen for both vite and uvicorn server ports
- Create fabricated data to test.

Notes: Scrum cycle 1 had a good linear progression. Our goals for end to end connection of the API and frontend layer was achievable within the timeframe, each component was developed and works in tandem with one another. Our group could benefit from clearer goals and deliniation of tasks for each user. Next scrum cycle will be heavy on developing the front end and start the building of the database which will allow us to further the fabrication of data via automated means. A more thurough set of goals is to be outlined with every group member. 

### Scrum Cycle 2:

- Database
    - Start work on the database using postgressSQL
    - Implement the ability to store all assets on the database
    - Implement the ability to store all lot ADT on the database
    - Add the ability to automatically fabricate data from the database
- Make sure the adequate data is stored on the database
    - how many cars are there, how many spaces are left, time stamps
- Improve map
    - Make home page visually appealing
    - Start structuring out what the user would be able to see when clicked on
        - create template for next page, get ready for integration

Notes: Scrum cycle 2 made furthering attempts to get the entire infrastructure of the project complete. By now the project has a working API and database layer and automatic generation of fabricated data using a Discrete Event Simulation approach. Frontend work has proven fruitful in producing a user experience that is not only easily manageable but also visually appealing. Final work in cycle 3 will attempt to layer the program in such a way that a prototype allows for seamless viewing of lot information for the user on a per-lot basis. The team is confident that the integration of all components will be achieved smoothly given the modular architecture established in previous cycles.

### Scrum Cycle 3

- Integration
  - Database ↔ FastAPI ↔ Frontend end-to-end connection
  - Standardized lot data responses (capacity, available spaces, timestamps)
  - Added loading/error handling for live requests

- Database
  - PostgreSQL reliably stores assets + per-lot status data
  - Fabricated data pipeline now writes/reads from DB consistently
  - Improved integrity/performance with constraints + indexing

- Frontend
  - Visual overhaul of the home/map view (cleaner layout + navigation)
  - Added per-lot detail view template for click-through viewing

- Spanish Support
  - English/Español toggle added
  - Core UI strings translated and structured for future localization

Notes: Cycle 3 unified the project: the database became the source of truth connecting backend and frontend, enabling stable per-lot viewing. The UI redesign improved readability and user flow, and Spanish support expanded accessibility while keeping the app ready for additional languages later.