"use strict";

/** Customer for Lunchly */
const { NotFoundError } = require("../expressError");

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      throw new NotFoundError(`No such customer: ${id}`);
    }

    return new Customer(customer);
  }


  /** get a customer by name  */

  static async getCustomersByName(name) {
    console.log("entered getCustomersByName()");
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE concat(first_name, ' ', last_name) ILIKE $1
           ORDER BY first_name, last_name`,
      [`%${name}%`],
    );

    const customers = results.rows;

    if (customers.length === 0) {
      throw new NotFoundError(`No customers matching name: ${name}`);
    }

    return customers.map(c => new Customer(c));
  }

  /** get top ten customers with most reservations */
  //TODO: update docstring returns {...}
  static async getTopTen() {

    const results = await db.query(
      `SELECT customers.id,
              customers.first_name AS "firstName",
              customers.last_name AS "lastName",
              customers.phone,
              customers.notes,
              COUNT(reservations) AS "numReservations"
      FROM customers
      JOIN reservations ON customers.id = reservations.customer_id
        GROUP BY customers.id
        ORDER BY COUNT(reservations) DESC
        LIMIT 10`
    );

    const customers = results.rows;
    console.log(customers);

    // TODO: change customer vars
    return customers.map(c => {
      let customer = {};
      let newCustomer = new Customer(c);
      customer["customer"] = newCustomer;
      customer["numReservations"] = c.numReservations;
      return customer;
    });

  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** gets full name of customer */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** get notes of a customer */
  get notes() {
    return this.notes;
  }

  /** set a note for a customer */
  set notes(note) {
    this.notes = note || "";
  }

}

module.exports = Customer;
