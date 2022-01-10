// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);


//Event to handle changes in database version
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("new_transfer", { autoIncrement: true });
};

request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;
  
  if(navigator.onLine) {
      //Upload any transactions that were registered while user was offline
      uploadTransactions();
  }
};

request.onerror = function(event) {
  //Log the error to the console
  console.log(event.target.errorCode);
};

//Function to save transaction if device does not have internet access
function saveTransaction(transaction) {
  const budgetTransaction = db.transaction(["new_transfer"], "readwrite");
  const budgetObjectStore = budgetTransaction.objectStore("new_transfer");
  budgetObjectStore.add(transaction);
}

//Function to upload transactions once application is back online
function uploadTransactions() {
  //Open database transaction
  const budgetTransaction = db.transaction(["new_transfer"], "readwrite");
  const budgetObjectStore = budgetTransaction.objectStore("new_transfer");

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
              const budgetTransaction = db.transaction(["new_transfer"], "readwrite");
              const budgetObjectStore = budgetTransaction.objectStore("new_transfer");
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
window.addEventListener('online', uploadTransactions);