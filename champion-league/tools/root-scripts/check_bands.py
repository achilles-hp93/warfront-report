import copy
import sys
sys.path.insert(0, sys.argv[1])
import generator.command_checks as cc
from generator.state import HQ_COMMANDS

req = next(c for c in HQ_COMMANDS if c.get("target") == "requisition")
saved = copy.deepcopy(req)
cases = {
    "missing": lambda c: c.pop("cost_by_rp"),
    "empty": lambda c: c.__setitem__("cost_by_rp", []),
    "descending": lambda c: c.__setitem__("cost_by_rp", [{"max_rp": 20, "cp": 3}, {"max_rp": 10, "cp": 5}]),
    "badkey": lambda c: c.__setitem__("cost_by_rp", [{"max_rp": 10, "cp": 3, "x": 1}]),
    "boolcp": lambda c: c.__setitem__("cost_by_rp", [{"max_rp": 10, "cp": True}]),
}
for name, mut in cases.items():
    mut(req)
    try:
        cc.validate_command_costs("fantasy")
        print(name, "NO ERROR")
    except ValueError as e:
        print(name, "->", str(e).splitlines()[1].strip())
    req.clear()
    req.update(copy.deepcopy(saved))
other = next(c for c in HQ_COMMANDS if c.get("target") != "requisition")
other["cost_by_rp"] = [{"max_rp": 10, "cp": 3}]
try:
    cc.validate_command_costs("fantasy")
    print("other NO ERROR")
except ValueError as e:
    print("other ->", str(e).splitlines()[1].strip())
del other["cost_by_rp"]
cc.validate_command_costs("fantasy")
print("clean OK")
