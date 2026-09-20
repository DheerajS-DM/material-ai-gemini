"""
Unit conversion and property normalization utility for MatWeb scraping.
Converts imperial engineering units (ksi, psi, lb/in³, °F) to SI units (MPa, GPa, kg/m³, °C).
"""

import re
from typing import Optional, Tuple

def parse_range_or_value(val_str: str) -> Optional[float]:
    """Extract conservative float value from strings like '200 - 240', '>= 150', '350'."""
    if not val_str:
        return None
    
    # Remove unwanted characters except numbers, dots, hyphens, and spaces
    cleaned = val_str.strip().replace(",", "")
    
    # Find all float-like patterns
    numbers = [float(n) for n in re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)]
    if not numbers:
        return None
    
    if len(numbers) == 1:
        return numbers[0]
    # For ranges, return lower bound for strength/modulus, or average if specified
    return numbers[0]

def convert_density_to_kg_m3(val_str: str) -> Optional[float]:
    """Convert g/cc, g/cm³, lb/in³, or kg/m³ to kg/m³."""
    if not val_str:
        return None
    
    val = parse_range_or_value(val_str)
    if val is None:
        return None
    
    val_lower = val_str.lower()
    if "g/cc" in val_lower or "g/cm" in val_lower:
        return val * 1000.0
    elif "lb/in" in val_lower or "lb/cu in" in val_lower:
        return val * 27679.9
    elif "kg/m" in val_lower:
        return val
    elif val < 30: # Assume g/cm³ if small scalar
        return val * 1000.0
    return val

def convert_stress_to_mpa(val_str: str) -> Optional[float]:
    """Convert ksi, psi, GPa, or MPa to MPa."""
    if not val_str:
        return None
    
    val = parse_range_or_value(val_str)
    if val is None:
        return None
    
    val_lower = val_str.lower()
    if "ksi" in val_lower:
        return val * 6.89476
    elif "psi" in val_lower:
        return val * 0.00689476
    elif "gpa" in val_lower:
        return val * 1000.0
    elif "mpa" in val_lower:
        return val
    return val

def convert_modulus_to_gpa(val_str: str) -> Optional[float]:
    """Convert Mpsi, ksi, GPa, or MPa to GPa."""
    if not val_str:
        return None
    
    val = parse_range_or_value(val_str)
    if val is None:
        return None
    
    val_lower = val_str.lower()
    if "mpsi" in val_lower or "10^6 psi" in val_lower:
        return val * 6.89476
    elif "ksi" in val_lower:
        return (val * 6.89476) / 1000.0
    elif "mpa" in val_lower:
        return val / 1000.0
    elif "gpa" in val_lower:
        return val
    elif val > 1000: # Assume MPa if large scalar
        return val / 1000.0
    return val

def convert_temp_to_celsius(val_str: str) -> Optional[float]:
    """Convert °F or °K to °C."""
    if not val_str:
        return None
    
    val = parse_range_or_value(val_str)
    if val is None:
        return None
    
    val_lower = val_str.lower()
    if "f" in val_lower or "fahrenheit" in val_lower:
        return (val - 32.0) * (5.0 / 9.0)
    elif "k" in val_lower or "kelvin" in val_lower:
        return val - 273.15
    return val
