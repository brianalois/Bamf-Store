"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("underscore");
var Model = /** @class */ (function () {
    function Model() {
    }
    Model.prototype.getModelName = function () {
        return this.constructor.getModelName();
    };
    Model.prototype.toObject = function () {
        var properties = Object.getOwnPropertyNames(this);
        var obj = {};
        for (var i in properties) {
            var property = properties[i];
            obj[property] = this[property];
        }
        return obj;
    };
    Model.prototype.uniqueQueryIdentifier = function () {
        var primary_id = this.constructor.getPrimaryKey();
        var query_obj = {};
        query_obj[primary_id] = this[primary_id];
        return query_obj;
    };
    Model.prototype.uniqueIdName = function () {
        return this.constructor.getPrimaryKey();
    };
    Model.prototype.save = function () {
        var query_obj = this.uniqueQueryIdentifier();
        var update_object = this.toObject();
        this.constructor.updateOne(query_obj, update_object);
        // return (this.constructor as any).instantiateObject(update_object);
    };
    Model.prototype.remove = function () {
        var query_obj = this.uniqueQueryIdentifier();
        this.constructor.remove(query_obj);
    };
    Model.prototype.getStorageValues = function () {
        var name = this.uniqueIdName();
        var id = this[name];
        return this.constructor.findById(id).toObject();
    };
    Model.prototype.getInstanceValues = function () {
        return this.toObject();
    };
    Model.prototype.getPropertyDifferences = function () {
        return this.constructor.difference(this.getInstanceValues(), this.getStorageValues());
    };
    Model.prototype.storageDifference = function () {
        var diff = this.getPropertyDifferences();
        var storage = this.getStorageValues();
        var storage_differences = _.pick(storage, function (value, key, object) {
            return diff.includes(key);
        });
        return storage_differences;
    };
    Model.prototype.instanceDifference = function () {
        var diff = this.getPropertyDifferences();
        var instance = this.getInstanceValues();
        var instance_differences = _.pick(instance, function (value, key, object) {
            return diff.includes(key);
        });
        return instance_differences;
    };
    //Static
    Model.describe = function () {
        var properties = Object.getOwnPropertyNames(this);
        properties = properties.splice(3);
        return properties;
    };
    Model.setlocalStorage = function (name, data) {
        localStorage.setItem(name, JSON.stringify(data));
    };
    Model.getlocalStorage = function (name) {
        return JSON.parse(localStorage.getItem(name) || '[]');
    };
    Model.removeLocalStorage = function (name) {
        localStorage.removeItem(name);
    };
    Model.getModelName = function () {
        if (!this.model_name)
            this.model_name = this.toString().split('(' || /s+/)[0].split(' ' || /s+/)[1];
        return this.model_name;
    };
    Model.removeAllData = function () {
        var model_name = this.getModelName();
        this.removeLocalStorage(model_name);
    };
    Model.setAllData = function (data) {
        var model_name = this.getModelName();
        this.setlocalStorage(model_name, data);
    };
    Model.getAllData = function () {
        var model_name = this.getModelName();
        var data = this.getlocalStorage(model_name);
        if (!data) {
            data = [];
            this.setAllData(data);
        }
        return data;
    };
    Model.getPrimaryKey = function () {
        var schema = this.SCHEMA;
        var primary_key = 'id';
        for (var key in schema) {
            var prop = schema[key];
            if (typeof prop === 'object') {
                for (var i in prop) {
                    var eprop = prop[i];
                    if (i === 'primary' && eprop === true) {
                        primary_key = key;
                    }
                }
            }
        }
        return primary_key;
    };
    Model.getSchema = function () {
        var schema = this.SCHEMA;
        if (!schema[this.getPrimaryKey()]) {
            schema['id'] = { type: 'number', primary: true };
        }
        return schema;
    };
    Model.schemaValidate = function (data) {
        var schema = this.getSchema();
        var new_data = {};
        for (var key in schema) {
            if (data[key]) {
                new_data[key] = data[key];
            }
            else {
                new_data[key] = '';
            }
        }
        return new_data;
    };
    Model.instantiateObject = function (obj_data) {
        var obj = new this();
        Object.assign(obj, obj_data);
        return obj;
    };
    Model.create = function (data) {
        var old_data = this.getAllData();
        var instance = this.schemaValidate(data);
        var primary_key = this.getPrimaryKey();
        if (!instance[primary_key]) {
            var id = 1;
            if (old_data.length != 0) {
                id = Math.max.apply(Math, old_data.map(function (o) { return o[primary_key]; }));
                id++;
            }
            instance[primary_key] = id;
        }
        old_data.push(instance);
        this.setAllData(old_data);
        var inst_obj = this.instantiateObject(instance);
        return inst_obj;
    };
    Model.remove = function (search) {
        var all_data = this.getAllData();
        var new_data = all_data.filter(function (data) { return !_.isMatch(data, search); });
        this.setAllData(new_data);
    };
    Model.update = function (search, new_data) {
        var all_data = this.getAllData();
        var instances = all_data.filter(function (data) { return _.isMatch(data, search); });
        if (!instances) {
            return null;
        }
        this.remove(search);
        for (var i in instances) {
            var instance = instances[i];
            for (var o in new_data) {
                instance[o] = new_data[o];
            }
            this.create(instance);
        }
    };
    Model.updateOne = function (search, new_data) {
        var all_data = this.getAllData();
        var instance = all_data.filter(function (data) { return _.isMatch(data, search); })[0];
        if (!instance) {
            return null;
        }
        this.remove(search);
        for (var o in new_data) {
            instance[o] = new_data[o];
        }
        return this.create(instance);
    };
    Model.findOne = function (search) {
        var all_data = this.getAllData();
        var instance;
        if (!search) {
            instance = all_data[0];
        }
        else {
            instance = all_data.filter(function (data) { return _.isMatch(data, search); })[0];
        }
        if (typeof instance === 'undefined' || !instance)
            return null;
        instance = this.instantiateObject(instance);
        return instance;
    };
    Model.find = function (search) {
        var all_data = this.getAllData();
        var instances = all_data.filter(function (data) { return _.isMatch(data, search); });
        var final_objs = instances;
        var array = [];
        for (var i in final_objs) {
            var instance = final_objs[i];
            instance = this.instantiateObject(instance);
            array.push(instance);
        }
        return array;
    };
    Model.findOneAndUpdate = function (search, data, options) {
        if (typeof search !== 'object') {
            console.log('search wrong');
        }
        var all_data = this.getAllData();
        var instance = all_data.filter(function (data) { return _.isMatch(data, search); })[0];
        var final_obj = instance;
        if (!instance) {
            if (typeof options === 'object' && options.upsert === true) {
                if (_.isEmpty(data)) {
                    final_obj = this.create(search);
                }
                else {
                    final_obj = this.create(data);
                }
            }
            else {
                null;
            }
        }
        else {
            final_obj = this.updateOne(search, data);
        }
        return final_obj;
    };
    Model.findById = function (id) {
        var primary_key = this.getPrimaryKey();
        var obj = {};
        obj[primary_key] = id;
        return this.findOne(obj);
    };
    Model.difference = function (a, b) {
        var diff = _.reduce(a, function (result, value, key) {
            return _.isEqual(value, b[key]) ?
                result : result.concat(key);
        }, []);
        return diff;
    };
    return Model;
}());
exports.Model = Model;
