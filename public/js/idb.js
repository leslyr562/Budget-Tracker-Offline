// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget', 1);


// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_budget', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run uploadBudget() function to send all local db data to api
    if (navigator.onLine) {
      // we haven't created this yet, but we will soon, so let's comment it out for now
      uploadBudget();
    }
  };
  
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };

  // This function will be executed if we attempt to submit a new amount and there's no internet connection
function saveBudget(budget) {
    // open a new transaction with the database with read and write permissions 
    const budgetTransaction = db.transaction(['new_budget'], 'readwrite');
  
    // access the object store for `new_budget`
    const budgetObjectStore = budgetTransaction.objectStore('new_budget');
  
    // add record to your store with add method
    budgetObjectStore.add(budget);
  }


  //Function to upload transactions once application is back online
function uploadBudget() {
  //Open database transaction
  const budgetTransaction = db.transaction(["new_budget"], "readwrite");
  const budgetObjectStore = budgetTransaction.objectStore("new_budget");

  //Get all transaction records
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function() {
      if(getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
              method: 'POST',
              body: JSON.stringify(getAll.result),
              headers: {
                  Accept: 'application/json, text/plain, */*',
                  'Content-Type': 'application/json'
              }
          })
          .then(response => response.json())
          .then(serverResponse => {
              if(serverResponse.message) {
                  throw new Error(serverResponse);
              }
              //Clear all transactions from the store
              const budgetTransaction = db.transaction(["new_budget"], "readwrite");
              const budgetObjectStore = budgetTransaction.objectStore("new_budget");
              budgetObjectStore.clear();

              alert("All budget transactions have been submitted.");
          })
          .catch(err => {
              console.log(err);
          });
      }
  };
}

//Upload transactions when application is back online
window.addEventListener('online', uploadBudget);