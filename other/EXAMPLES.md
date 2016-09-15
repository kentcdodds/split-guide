# Examples

- [react-jest-workshop](https://github.com/kentcdodds/react-jest-workshop)
- [es6-workshop](https://github.com/kentcdodds/es6-workshop)

## Parser issues?

I've run into a case where I want:

**exercise/**

```javascript
function myFunction({foo, bar}) {
}
```

**exercise-final/**

```javascript
function myFunction({foo, bar}) {
}
```

To accomplish this, you might think to try to do this:

```javascript
// FINAL_START
function myFunction({foo, bar} = {}) {
// FINAL_END
// WORKSHOP_START
function myFunction({foo, bar}) {
// WORKSHOP_END
}
```

But if you're using ESLint or something on your templates,
then you're going to have a hard time parsing that.
So instead, you can use the comment directive:

```javascript
// FINAL_START
function myFunction({foo, bar} = {}) {
  // FINAL_END
  // COMMENT_START make the parser happy :)
} // this will be removed
// COMMENT_END
// WORKSHOP_START
function myFunction({foo, bar}) {
  // WORKSHOP_END
  // stuff
}
```
