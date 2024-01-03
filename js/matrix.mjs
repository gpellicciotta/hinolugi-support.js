import * as utils from './utils.mjs';

// Matrix class and functions

/**
 *  A matrix class.
 */
export class Matrix {
  /**
   *  Create a Matrix based on the provided array.
   *
   *  @param array The 2d-array to turn into a Matrix. It should be a regular array having the same number of cols for each row.
   */
  static fromArray(array) {
    let rows = array.length;
    let cols = array[0].length;
    return new Matrix(rows, cols, array);
  }

  /**
   *  Create an identity Matrix.
   *
   *  @param rows The number of rows.
   *  @param cols The number of columns.
   */
  static identity(rows, cols) {
    let initializerF = function(r, c) { return (r === c) ? 1 : 0; };
    return new Matrix(rows, cols, initializerF);
  }

  /**
   *  Create a Matrix with random values.
   *
   *  @param rows The number of rows.
   *  @param cols The number of columns.
   *  @param minValue The min. random value for each element, inclusive.
   *  @param maxValue The max. random value for each element, inclusive.
   */
  static random(rows, cols, minVal = 0.0, maxVal = 1.0) {
    let initializerF = function() { return utils.randomFloat(minVal, maxVal); };
    return new Matrix(rows, cols, initializerF);
  }

  /**
   *  Create a new matrix.
   *
   *  @param rows The number of rows.
   *  @param cols The number of columns.
   *  @param fillValue Can be either
   *                    a) a scalar value or
   *                    b) a function producing a scalar value, or
   *                    c) a compatible Matrix object, or
   *                    d) a compatible 2d-Array
   */
  constructor(rows, cols, fillValue = 0.0) {
    this._rows = rows;
    this._cols = cols;
    this._vals = new Array(this._rows);
    for (let r = 0; r < this._rows; r++) {
      this._vals[r] = new Array(this._cols);
    }
    this.fill(fillValue);
  }

  get rows() {
    return this._rows;
  }

  get columns() {
    return this._cols;
  }

  get elementCount() {
    return this._rows * this._cols;
  }

  /**
   *  Fill a matrix with either a scalar value or based on a compatible Matrix or Array.
   *
   *  @param fillValue Can be either
   *                    a) a scalar value or
   *                    b) a function producing a scalar value, or
   *                    c) a compatible Matrix object, or
   *                    d) a compatible 2d-Array
   */
  fill(fillValue = 0.0) {
    if (fillValue instanceof Matrix) {
      let matrix = fillValue;
      if (matrix._rows !== this._rows) {
        throw new Error("Fill-value matrix has " + matrix._rows + " rows while expecting " + this._rows);
      }
      if (matrix._cols !== this._cols) {
        throw new Error("Fill-value matrix has " + matrix._cols + " columns while expecting " + this._cols);
      }
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = matrix._vals[r][c];
        }
      }
    }
    else if (fillValue instanceof Array) {
      let array = fillValue;
      if (array.length !== this._rows) {
        throw new Error("Fill-value array has " + array.length + " rows while expecting " + this._rows);
      }
      for (let r = 0; r < array.length; r++) {
        if (array[r].length !== this._cols) { // TODO: also check all other rows?
          throw new Error("Fill-value matrix has " + array[0].length + " columns in row " + r + " while expecting " + this._cols);
        }
      }
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = array[r][c];
        }
      }
    }
    else if (fillValue instanceof Function) {
      let func = fillValue;
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = func(r, c);
        }
      }
    }
    else { // Scalar value
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = fillValue;
        }
      }
    }
  }

  multiplyEachElement(numberToMultiply) {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        this._vals[r][c] *= numberToMultiply;
      }
    }
  }

  addToEachElement(numberToAdd) {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        this._vals[r][c] += numberToAdd;
      }
    }
  }

  checkDimensions(matrix, expectedRows, expectedCols) {
    if (!(matrix instanceof Matrix)) {
      throw new Error("Matrix expected but received " + typeof(matrix));
    }
    if (matrix._rows !== expectedRows) {
      throw new Error("Matrix has " + matrix._rows + " rows while expecting " + expectedRows);
    }
    if (matrix._cols !== expectedCols) {
      throw new Error("Matrix has " + matrix._cols + " columns while expecting " + expectedCols);
    }
  }

  equal(other) {
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          if (this._vals[r][c] !== other._vals[r][c]) {
            return false;
          }
        }
      }
    }
    else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          if (this._vals[r][c] !== other) {
            return false;
          }
        }
      }
    }
    return true;
  }

  plus(other) {
    let result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] + other._vals[r][c];
        }
      }
    }
    else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] + other;
        }
      }
    }
    return result;
  }

  minus(other) {
    let result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] - other._vals[r][c];
        }
      }
    }
    else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] - other;
        }
      }
    }
    return result;
  }

  multiply(other) {
    let result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] * other._vals[r][c];
        }
      }
    }
    else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] * other;
        }
      }
    }
    return result;
  }

  checkMatrixMultiplyDimensions(matrix, expectedRows) {
    if (!(matrix instanceof Matrix)) {
      throw new Error("Matrix expected but received " + typeof(matrix));
    }
    if (matrix._rows !== expectedRows) {
      throw new Error("Matrix has " + matrix._rows + " rows while expecting " + expectedRows);
    }
  }

  /**
   *  Matrix multiplication.
   */
  matrixMultiply(other) {
    this.checkMatrixMultiplyDimensions(other, this._cols);
    let result = new Matrix(this._rows, other._cols);
    for (let r = 0; r < result._rows; r++) {
      for (let c = 0; c < result._cols; c++) {
        let dotProduct = 0;
        for (let i = 0; i < this._cols; i++) {
          dotProduct += (this._vals[r][i] * other._vals[i][c]);
        }
        result._vals[r][c] = dotProduct;
      }
    }
    return result;
  }

  divide(other) {
    let result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] / other._vals[r][c];
        }
      }
    }
    else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] / other;
        }
      }
    }
    return result;
  }

  map(mapF) {
    let result = new Matrix(this._rows, this._cols);
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        result._vals[r][c] = mapF(this._vals[r][c], r, c);
      }
    }
    return result;
  }

  transpose() {
    let result = new Matrix(this._cols, this._rows);
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        result._vals[c][r] = this._vals[r][c];
      }
    }
    return result;
  }

  toArray() {
    return this._vals.slice();
  }

  valueOf() {
    return this._vals.slice();
  }

  toString(decimals=0) {
    let str = "";
    for (let r = 0; r < this._rows; r++) {
      str += "\n";
      let row = this._vals[r];
      for (let c = 0; c < this._cols; c++) {
        str += utils.decimalString(row[c], decimals);
        str += "  ";
      }
    }
    return str;
  }

  log(msg) {
    msg = msg || (this._rows + "x" + this._cols + " matrix:");
    console.log(msg);
    console.table(this._vals);
  }

  static test() {
    let a = new Matrix(2, 2);
    a.fill(() => utils.random(1, 10));
    console.table(a._vals);
    a = a.map((v) => v * 2);
    console.table(a._vals);
  }
}