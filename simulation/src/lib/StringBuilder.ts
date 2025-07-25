export class StringBuilder {
  private parts: string[] = [];

  append(text: string): StringBuilder {
    if (text) {
      this.parts.push(text);
    }
    return this;
  }

  appendIf(condition: boolean, text: string): StringBuilder {
    if (condition && text) {
      this.parts.push(text);
    }
    return this;
  }

  toString(separator: string = ''): string {
    return this.parts.join(separator);
  }

  toStringWithAnd(): string {
    if (this.parts.length === 0) return '';
    if (this.parts.length === 1) return this.parts[0];
    if (this.parts.length === 2) return this.parts.join(' and ');

    const last = this.parts[this.parts.length - 1];
    const rest = this.parts.slice(0, -1);
    return rest.join(', ') + ', and ' + last;
  }

  clear(): StringBuilder {
    this.parts = [];
    return this;
  }

  isEmpty(): boolean {
    return this.parts.length === 0;
  }
} 