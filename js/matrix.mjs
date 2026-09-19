import { decimalString, randomFloat } from './math.mjs';

/**
 * 2D matrix mathematics, transformations, and linear algebra operations.
 *
 * Provides the Matrix class for creating, manipulating, multiplying,
 * transposing, and mapping 2D numeric matrices.
 *
 * @module matrix
 */

/**
 * A 2D numeric matrix supporting arithmetic, scalar operations, and matrix algebra.
 */
export class Matrix {
  /**
   * Create a Matrix based on the provided 2D array.
   *
   * @param {number[][]} array The 2D array to turn into a Matrix (must have rectangular dimensions).
   * @returns {Matrix} The newly created Matrix instance.
   */
  static fromArray(array) {
    const rows = array.length;
    const cols = array[0].length;
    return new Matrix(rows, cols, array);
  }

  /**
   * Create an identity Matrix of specified dimensions.
   *
   * @param {number} rows The number of rows.
   * @param {number} cols The number of columns.
   * @returns {Matrix} An identity Matrix with ones along the main diagonal and zeros elsewhere.
   */
  static identity(rows, cols) {
    const initializerF = function (r, c) {
      return r === c ? 1 : 0;
    };
    return new Matrix(rows, cols, initializerF);
  }

  /**
   * Create a Matrix populated with random float values.
   *
   * @param {number} rows The number of rows.
   * @param {number} cols The number of columns.
   * @param {number} [minVal=0.0] The minimum random value for each element (inclusive).
   * @param {number} [maxVal=1.0] The maximum random value for each element (inclusive).
   * @returns {Matrix} A new Matrix with random entries.
   */
  static random(rows, cols, minVal = 0.0, maxVal = 1.0) {
    const initializerF = function () {
      return randomFloat(minVal, maxVal);
    };
    return new Matrix(rows, cols, initializerF);
  }

  /**
   * Create a new matrix with specified dimensions and initial fill values.
   *
   * @param {number} rows The number of rows.
   * @param {number} cols The number of columns.
   * @param {number|Function|Matrix|number[][]} [fillValue=0.0] Can be a scalar number, a function `(row, col) => number`, a compatible Matrix, or a 2D array.
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

  /**
   * Number of rows in the matrix.
   *
   * @type {number}
   */
  get rows() {
    return this._rows;
  }

  /**
   * Number of columns in the matrix.
   *
   * @type {number}
   */
  get columns() {
    return this._cols;
  }

  /**
   * Total number of elements in the matrix (rows * columns).
   *
   * @type {number}
   */
  get elementCount() {
    return this._rows * this._cols;
  }

  /**
   * Fill the matrix with a scalar value, a generator function, or from a compatible Matrix or 2D array.
   *
   * @param {number|Function|Matrix|number[][]} [fillValue=0.0] Value or generator used to populate all elements.
   * @throws {Error} If dimensions of provided Matrix or array do not match.
   * @returns {void}
   */
  fill(fillValue = 0.0) {
    if (fillValue instanceof Matrix) {
      const matrix = fillValue;
      if (matrix._rows !== this._rows) {
        throw new Error('Fill-value matrix has ' + matrix._rows + ' rows while expecting ' + this._rows);
      }
      if (matrix._cols !== this._cols) {
        throw new Error('Fill-value matrix has ' + matrix._cols + ' columns while expecting ' + this._cols);
      }
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = matrix._vals[r][c];
        }
      }
    } else if (fillValue instanceof Array) {
      const array = fillValue;
      if (array.length !== this._rows) {
        throw new Error('Fill-value array has ' + array.length + ' rows while expecting ' + this._rows);
      }
      for (let r = 0; r < array.length; r++) {
        if (array[r].length !== this._cols) {
          // TODO: also check all other rows?
          throw new Error(
            'Fill-value matrix has ' + array[0].length + ' columns in row ' + r + ' while expecting ' + this._cols,
          );
        }
      }
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = array[r][c];
        }
      }
    } else if (fillValue instanceof Function) {
      const func = fillValue;
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = func(r, c);
        }
      }
    } else {
      // Scalar value
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          this._vals[r][c] = fillValue;
        }
      }
    }
  }

  /**
   * Multiply each element in this matrix in-place by a scalar number.
   *
   * @param {number} numberToMultiply The scalar factor.
   * @returns {void}
   */
  multiplyEachElement(numberToMultiply) {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        this._vals[r][c] *= numberToMultiply;
      }
    }
  }

  /**
   * Add a scalar number in-place to each element in this matrix.
   *
   * @param {number} numberToAdd The scalar increment.
   * @returns {void}
   */
  addToEachElement(numberToAdd) {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        this._vals[r][c] += numberToAdd;
      }
    }
  }

  /**
   * Verify that the given argument is a Matrix instance with expected row and column counts.
   *
   * @param {*} matrix Candidate matrix to validate.
   * @param {number} expectedRows Expected number of rows.
   * @param {number} expectedCols Expected number of columns.
   * @throws {Error} If argument is not a Matrix or dimensions do not match.
   * @returns {void}
   */
  checkDimensions(matrix, expectedRows, expectedCols) {
    if (!(matrix instanceof Matrix)) {
      throw new Error('Matrix expected but received ' + typeof matrix);
    }
    if (matrix._rows !== expectedRows) {
      throw new Error('Matrix has ' + matrix._rows + ' rows while expecting ' + expectedRows);
    }
    if (matrix._cols !== expectedCols) {
      throw new Error('Matrix has ' + matrix._cols + ' columns while expecting ' + expectedCols);
    }
  }

  /**
   * Check whether this matrix equals another matrix (element-wise) or a scalar.
   *
   * @param {Matrix|number} other The matrix or scalar value to compare against.
   * @returns {boolean} True if all elements match, false otherwise.
   */
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
    } else {
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

  /**
   * Add another matrix (element-wise) or a scalar to this matrix, returning a new Matrix.
   *
   * @param {Matrix|number} other The matrix or scalar to add.
   * @returns {Matrix} A new Matrix containing the sum.
   */
  plus(other) {
    const result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] + other._vals[r][c];
        }
      }
    } else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] + other;
        }
      }
    }
    return result;
  }

  /**
   * Subtract another matrix (element-wise) or a scalar from this matrix, returning a new Matrix.
   *
   * @param {Matrix|number} other The matrix or scalar to subtract.
   * @returns {Matrix} A new Matrix containing the difference.
   */
  minus(other) {
    const result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] - other._vals[r][c];
        }
      }
    } else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] - other;
        }
      }
    }
    return result;
  }

  /**
   * Multiply another matrix (element-wise) or a scalar with this matrix, returning a new Matrix.
   *
   * @param {Matrix|number} other The matrix (element-wise) or scalar factor.
   * @returns {Matrix} A new Matrix containing the element-wise product.
   */
  multiply(other) {
    const result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] * other._vals[r][c];
        }
      }
    } else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] * other;
        }
      }
    }
    return result;
  }

  /**
   * Validate dimensions for matrix multiplication (this.columns === other.rows).
   *
   * @param {*} matrix Candidate matrix to validate.
   * @param {number} expectedRows Expected number of rows (matching this matrix's column count).
   * @throws {Error} If matrix is invalid or rows don't match expectedRows.
   * @returns {void}
   */
  checkMatrixMultiplyDimensions(matrix, expectedRows) {
    if (!(matrix instanceof Matrix)) {
      throw new Error('Matrix expected but received ' + typeof matrix);
    }
    if (matrix._rows !== expectedRows) {
      throw new Error('Matrix has ' + matrix._rows + ' rows while expecting ' + expectedRows);
    }
  }

  /**
   * Perform matrix multiplication (dot product of rows with columns).
   *
   * @param {Matrix} other The right-hand Matrix to multiply by.
   * @returns {Matrix} A new Matrix representing the matrix product.
   */
  matrixMultiply(other) {
    this.checkMatrixMultiplyDimensions(other, this._cols);
    const result = new Matrix(this._rows, other._cols);
    for (let r = 0; r < result._rows; r++) {
      for (let c = 0; c < result._cols; c++) {
        let dotProduct = 0;
        for (let i = 0; i < this._cols; i++) {
          dotProduct += this._vals[r][i] * other._vals[i][c];
        }
        result._vals[r][c] = dotProduct;
      }
    }
    return result;
  }

  /**
   * Divide this matrix by another matrix (element-wise) or a scalar divisor.
   *
   * @param {Matrix|number} other The matrix (element-wise) or scalar divisor.
   * @returns {Matrix} A new Matrix containing the element-wise quotient.
   */
  divide(other) {
    const result = new Matrix(this._rows, this._cols);
    if (other instanceof Matrix) {
      this.checkDimensions(other, this._rows, this._cols);
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] / other._vals[r][c];
        }
      }
    } else {
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          result._vals[r][c] = this._vals[r][c] / other;
        }
      }
    }
    return result;
  }

  /**
   * Transform each element of the matrix with a mapping function.
   *
   * @param {Function} mapF Function invoked with `(value, row, col)` returning the new element value.
   * @returns {Matrix} A new Matrix with mapped values.
   */
  map(mapF) {
    const result = new Matrix(this._rows, this._cols);
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        result._vals[r][c] = mapF(this._vals[r][c], r, c);
      }
    }
    return result;
  }

  /**
   * Transpose this matrix, swapping rows and columns.
   *
   * @returns {Matrix} A new transposed Matrix.
   */
  transpose() {
    const result = new Matrix(this._cols, this._rows);
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        result._vals[c][r] = this._vals[r][c];
      }
    }
    return result;
  }

  /**
   * Return a shallow copy of the underlying 2D array of values.
   *
   * @returns {number[][]} The 2D array of rows and columns.
   */
  toArray() {
    return this._vals.slice();
  }

  /**
   * Return a shallow copy of the underlying 2D array of values (for JavaScript valueOf protocol).
   *
   * @returns {number[][]} The 2D array of rows and columns.
   */
  valueOf() {
    return this._vals.slice();
  }

  /**
   * Format the matrix into a human-readable multi-line string.
   *
   * @param {number} [decimals=0] The number of decimals to format each element with.
   * @returns {string} Formatted multi-line matrix string.
   */
  toString(decimals = 0) {
    let str = '';
    for (let r = 0; r < this._rows; r++) {
      str += '\n';
      const row = this._vals[r];
      for (let c = 0; c < this._cols; c++) {
        str += decimalString(row[c], decimals);
        str += '  ';
      }
    }
    return str;
  }

  /**
   * Print this matrix to the console via console.table.
   *
   * @param {string} [msg] Optional header message to log before table output.
   * @returns {void}
   */
  log(msg) {
    msg = msg || this._rows + 'x' + this._cols + ' matrix:';
    console.log(msg);
    console.table(this._vals);
  }
}
