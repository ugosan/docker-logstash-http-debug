module.exports = {
    dive: function (currentKey, into, target) {
        for (var i in into) {
            if (into.hasOwnProperty(i)) {
                var newKey = i;
                var newVal = into[i];

                if (currentKey.length > 0) {
                    newKey = currentKey + '.' + i;
                }

                if (typeof newVal === "object") {
                    this.dive(newKey, newVal, target);
                } else {
                    target[newKey] = newVal;
                }
            }
        }
    },
    flatten: function (arr) {
        var newObj = {};
        this.dive("", arr, newObj);
        return newObj;
    }
}