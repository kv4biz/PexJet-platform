---
trigger: always_on
---

Project: 
3 website for Pexjet platform
Public Website - pexjet.com for client
Admin Dashboard - admin.pexjet.com for admin users
Operator dashboard - operator.pexjet.com for operators
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Public website Expectation:
what will be in the website:
Client can:
- View latest empty leg deals
- Request quote for charter flight and empty leg deals
- Subscribe for news on empty leg deals for certain location
- Send message to the admin in the contact page.
- view aircraft available for display

Pages:
- Home
- Charter
- Empty-leg
- Aircraft management
- About/
--- About/Our company
--- About/Aircraft Acquisition
--- About/Operator
- Contact
- Services

UI expectation
Can create all possible screen flow for all action on the platform and we will add it to Figma Make to create the Ui
UI rules:
- Simple and responsive
- Use only Shadcn UI component(No Div, H1-H6, or P)
- clean and consistence
- color: metallic gold, and shades of white and black
- no rounded corners and shadows
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Admin Expectation: 
admin role: Super admin and staff only 
what will be in the dashboard:  

Airport management:   
- read only. Database from OurAirports.com  
- the file are airports.csv, countries.csv and . regions.csv  
- dataset include the: Airport name. city, country, country code, state or province, Latitude & longitude, ICAO code, IATA code,  and Airport type  

Aircraft management:  
- Create, Update, Read, and Delete aircraft(details on the plane. suggest any dataset that provide a list of all aircrafts and their information)  
- we only need this info in the dataset: Aircraft name , Model, type, specification, interior & exterior dimension, images of both interior and exterior, and others. 
- set which aircraft is available for local and international flight(For display) 

Client management:  
- 2 group of client lists:
- for those who have either paid for an empty leg bill or charter bill. Their WhatsApp phone numbers is their unique Id and we can see all the bills for each unique id.
- The list for user that subscribed for news on empty leg either on cities, or flights or all. unique id is WhatsApp number. They get weekly update on the empty leg deal available from the platforms with links to request quote
- Admin can send public Announcements to all client users(image and texts) e.g. Christmas poster card, black Friday deals etc.

Charter flight management 
- From the website, client request quote for charter flight will be created, the Pexjet admin staffs will be notified on their WhatsApp group. his will have flight type(one way, round trip, and multi leg), flight array {from, to, date-time}, selected jet(s) 
- Once there charter quote is one the database the admin can, read, approved, and rejects the quotes.
- if rejected a simple message is sent to the client WhatsApp number with the selected rejection reason.
- If a quotes is approved the system sends a WhatsApp message with a Quote confirmation document that has all information input into it. these are aircraft, flight itinerary, date and time, and price
- Document will also have a payment link to make payment within 3hrs at the bottom(Paystack generated link)
- when payment is made the admin is notified and a receipt is sent to the client email and WhatsApp  and also the flight confirmation document need by the client for the flight.

Empty leg Management
- Empty leg deals is created by the admin(also operator but let leave that for now) 
- empty legs have: departure, destination, departure date time, aircraft(selected aircraft), estimated arrival(calculated), seat left, original price and discount price.
-Empty leg deal must be SEO optimized
- From the website the client can view all empty leg uploaded by Pexjet admins (or from operator to) and request for quote
- Once there empty-leg quote is one the database the admin can, read, approved, and rejects the quotes.
- if rejected a simple message is sent to the client WhatsApp number with the selected rejection reason.
- If a quotes is approved the system sends a WhatsApp message with a Quote confirmation document that has all information input into it. these are aircraft, flight itinerary, date and time, and price
- Document will also have a payment link to make payment within 3hrs at the bottom(Paystack generated link)
- when payment is made the admin is notified and a receipt is sent to the client email and WhatsApp  and also the flight confirmation document need by the client for the flight.

Log Tracking
- Take log of every action done by all users(Admin/Operator/Client)
- All log are viewed by only the Super Admin
- Action include: Quote Requests, Payment, Admin management, etc.

Analytics
- Give a basic analysis of the operation on the platform.
- Result shows for both monthly and yearly data

Admin Management
- For only super Admin
- Create more admin staff. Staff/Super-admin: Full Name, Company Email, Phone Number(WhatsApp), Default Password(full-name + phone-number-last-4-digits), Role, Avatar, Address, Username and Status(online/Offline)
-Create the Operator, input full name  

Settings
- Change password
- Update Profile: Full Name, Username, Phone number, Password, and Avatar

Payment/Transactions 
- We will use Paystack
- Will go straight TO PEXJET local account straight
- All payment must be logged and also added to the analytics

Auth
- No one can just create an account expect the Super Admin
- All admin can Login and Forgot Password
- login will be identifier(username or email) and password only
- Forgot Password will send a OTP to the user WhatsApp after been confirm the user can input the new password

Dependencies Integration
- Twillo for WhatsApp
- Paystack for transaction
- PDFKit for pdf
- Nodemailer for emails
- Pusher Channels to add real-time updates

For UI
can you create all possible screen flow for all action on the platform and we will add it to Figma Make to create the Ui
UI rules:
- Simple and responsive
- Use only Shadcn UI component(No Div, H1-H6, or P)
- clean and consistence
- Light/Dark mode
- Subtle touch of metallic gold color
- Add components like form-generator, table-generator, detail-panel, etc to make consistent design

System expectation:
- Everything backend + API inside Next.js
- I want strong security 
- I want enterprise-grade structure
- I want full control of the database design
 I want scalable aviation architecture
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Operator Expectation:
only one user role : Operator
Operator can:

Fleet Management
- View all aircraft
- Select up to 10 aircrafts for personal fleet

Empty Leg Management
- Create Empty legs deals
- Update deals the have created
- If a client request a quote on their deal, the will be notified on WhatsApp and will come to their dashboard  to view the quote, If rejected, it will send a message to the user that it was rejected with a select reason why
- If a quotes is approved the system sends a WhatsApp message with a Quote confirmation document that has all information input into it. these are aircraft, flight itinerary, date and time, and price
- Document will also have a payment link to make payment within 3hrs at the bottom(Paystack generated link)
- the payment is split to the admin(a specific charge we let them know we take from the deal) and the rest goes to the operator (actual bank account connect to)
- when payment is made the operator is notified and a receipt is sent to the client email and WhatsApp  and also the flight confirmation document need by the client for the flight.

History
- see the history of all the deals by the operator
- see all payment made to the operator(no money is stored, it going straight to the operator local bank account.)

Settings
- Change password
- Update Profile: Full Name, Username, Phone number, Password, and Avatar

Payment Flow for empty leg by operators
since Operator onboarding (manual):
- Operators cannot create their own account.
- PexJet team collects:
	Full name
	Email
	Bank account details
	PexJet generates a password for the operator (e.g., Name2025, they will be told to change it).
Paystack subaccount creation:
- PexJet manually creates a Paystack subaccount for the operator.
- The subaccount is linked to the operator’s local bank account.
- PexJet team keeps credentials and controls the account.
Payment processing:
- User pays via Paystack.
- Total payment is collected in PexJet’s Paystack account.
- Using Paystack subaccounts, the payment is split:
Admin cut (your portion)
- Operator cut goes directly to the operator’s linked local bank account
- Operator receives funds automatically:
	Paystack handles disbursement to the operator bank via the linked subaccount.
	PexJet automatically keeps the admin cut.
Auth
- No one can just create an account. it done by the super admin
- All operator can Login and Forgot Password
- login will be identifier(username or email) and password only
- Forgot Password will send a OTP to the user WhatsApp after been confirm the user can input the new password

Dependencies Integration
- Twillo for WhatsApp
- Paystack for transaction
- PDFKit for pdf
- Nodemailer for emails sending
- Pusher Channels to add real-time updates
- cloudinary for e

For UI
can you create all possible screen flow for all action on the platform and we will add it to Figma Make to create the Ui
UI rules:
- Simple and responsive
- Use only Shadcn UI component(No Div, H1-H6, or P)
- clean and consistence
- Light/Dark mode
- Subtle touch of metallic gold color
- Add components like form-generator, table-generator, detail-panel, etc to make consistent design

System expectation:
- Everything backend + API inside Next.js
- I want strong security 
- I want enterprise-grade structure
- I want full control of the database design
 I want scalable aviation architecture
